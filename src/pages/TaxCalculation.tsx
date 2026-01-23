import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'
import { FileSpreadsheet, Search, Calculator, Calendar } from 'lucide-react'
import Modal from '../components/Modal'
import TaxDetailModal from '../components/TaxDetailModal'
import * as XLSX from 'xlsx'
import { calculatePIT, formatCurrency } from '../utils/tax'

type IncomeRecord = Database['public']['Tables']['income_records']['Row'] & {
    employees: Database['public']['Tables']['employees']['Row'] | null
}

export default function TaxCalculation() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
    const [records, setRecords] = useState<IncomeRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importing, setImporting] = useState(false)
    const [search, setSearch] = useState('')
    const [detailModalData, setDetailModalData] = useState<{ name: string, taxable: number, tax: number } | null>(null)

    const fetchRecords = async () => {
        setLoading(true)
        const date = `${selectedMonth}-01`

        const { data, error } = await supabase
            .from('income_records')
            .select('*, employees(*)')
            .eq('month', date)

        if (error) console.error(error)
        else setRecords(data as any || [])
        setLoading(false)
    }

    useEffect(() => { fetchRecords() }, [selectedMonth])

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                // 1. Fetch Employees Map (Code -> Id)
                const { data: emps } = await supabase.from('employees').select('id, code')
                const empMap = new Map(emps?.map(e => [e.code, e.id]))

                // 2. Fetch Dependents for this month to calculate deduction count
                const monthDate = `${selectedMonth}-01`
                const { data: deps } = await supabase.from('dependents')
                    .select('employee_id')
                    .lte('deduction_start_month', monthDate)
                    .or(`deduction_end_month.is.null,deduction_end_month.gte.${monthDate}`)
                    .eq('is_active', true)

                // Count dependents per employee
                const depCount = new Map<string, number>()
                deps?.forEach(d => {
                    if (d.employee_id) depCount.set(d.employee_id, (depCount.get(d.employee_id) || 0) + 1)
                })

                // 3. Process Rows
                const upsertData = []
                const SELF_DEDUCTION = 11_000_000
                const DEP_DEDUCTION_RATE = 4_400_000

                for (const row of data) {
                    const code = row['MaNV'] || row['Mã NV']
                    const empId = empMap.get(code)

                    if (!empId) continue // Skip unknown employees

                    const totalIncome = Number(row['TongThuNhap'] || row['Tổng Thu Nhập'] || 0)
                    const exemptIncome = Number(row['KhgChiuThue'] || row['Không Chịu Thuế'] || 0)
                    const insurance = Number(row['BaoHiem'] || row['Bảo Hiểm'] || 0)

                    const depNum = depCount.get(empId) || 0
                    const depDeduction = depNum * DEP_DEDUCTION_RATE

                    // Formula: Taxable = Total - Exempt - Insurance - Self - Dependent
                    let taxable = totalIncome - exemptIncome - insurance - SELF_DEDUCTION - depDeduction
                    if (taxable < 0) taxable = 0

                    const taxAmount = calculatePIT(taxable)

                    upsertData.push({
                        employee_id: empId,
                        month: monthDate,
                        total_income: totalIncome,
                        tax_exempt_income: exemptIncome,
                        insurance_deduction: insurance,
                        dependent_deduction: depDeduction,
                        self_deduction: SELF_DEDUCTION,
                        taxable_income: taxable,
                        tax_amount: taxAmount
                    })
                }

                if (upsertData.length > 0) {
                    const { error } = await supabase.from('income_records').upsert(upsertData, { onConflict: 'employee_id,month' })
                    if (error) throw error
                    alert(`Đã tính thuế xong cho ${upsertData.length} nhân viên!`)
                    setIsImportOpen(false)
                    fetchRecords()
                } else {
                    alert('Không có dữ liệu hợp lệ (kiem tra mã nhân viên)')
                }

            } catch (err: any) {
                alert('Lỗi: ' + err.message)
            } finally {
                setImporting(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    // Stats
    const totalTax = records.reduce((sum, r) => sum + (r.tax_amount || 0), 0)
    const totalIncome = records.reduce((sum, r) => sum + (r.total_income || 0), 0)

    const filtered = records.filter(r =>
        r.employees?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.employees?.code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tính Thuế TNCN</h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý và tính toán thuế theo tháng</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm">
                        <Calendar size={18} className="text-slate-500" />
                        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-transparent outline-none text-slate-700 font-medium" />
                    </div>
                    <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium whitespace-nowrap">
                        <Calculator size={18} /> Tính Thuế (Import)
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Tổng Thu Nhập</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Tổng Thuế Phải Nộp</h3>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(totalTax)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Số Nhân Viên</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{records.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-700">Chi tiết bảng lương tháng {selectedMonth}</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50">Nhân viên</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Tổng thu nhập</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Miễn thuế</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Bảo hiểm</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">GT Bản thân</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">GT Phụ thuộc</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Thu nhập tính thuế</th>
                                <th className="p-4 text-xs font-bold text-primary-600 uppercase text-right sticky right-0 bg-slate-50">Thuế PN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Chưa có dữ liệu tính thuế cho tháng này</td></tr>
                            ) : (
                                filtered.map(rec => (
                                    <tr key={rec.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 sticky left-0 bg-white">
                                            <div className="font-medium text-slate-900">{rec.employees?.full_name}</div>
                                            <div className="text-xs text-slate-500">{rec.employees?.code}</div>
                                        </td>
                                        <td className="p-4 text-right text-slate-700">{formatCurrency(rec.total_income || 0)}</td>
                                        <td className="p-4 text-right text-slate-500">{formatCurrency(rec.tax_exempt_income || 0)}</td>
                                        <td className="p-4 text-right text-slate-500">{formatCurrency(rec.insurance_deduction || 0)}</td>
                                        <td className="p-4 text-right text-slate-500">{formatCurrency(rec.self_deduction || 0)}</td>
                                        <td className="p-4 text-right text-slate-500">{formatCurrency(rec.dependent_deduction || 0)}</td>
                                        <td className="p-4 text-right font-medium text-slate-800">{formatCurrency(rec.taxable_income || 0)}</td>
                                        <td
                                            className="p-4 text-right font-bold text-primary-600 sticky right-0 bg-white shadow-sm border-l cursor-pointer hover:bg-primary-50 active:text-primary-800 underline decoration-dotted underline-offset-4"
                                            onClick={() => setDetailModalData({
                                                name: rec.employees?.full_name || '',
                                                taxable: rec.taxable_income || 0,
                                                tax: rec.tax_amount || 0
                                            })}
                                            title="Bấm để xem chi tiết tính thuế"
                                        >
                                            {formatCurrency(rec.tax_amount || 0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title={`Import Lương tháng ${selectedMonth}`}>
                <div className="space-y-4">
                    {!importing ? (
                        <>
                            <div className="bg-amber-50 p-4 rounded text-sm text-amber-800 border border-amber-200">
                                <strong>Hướng dẫn:</strong> Upload file Excel chứa thông tin thu nhập của tháng <strong>{selectedMonth}</strong>.
                                Hệ thống sẽ tự động tính thuế dựa trên cấu hình giảm trừ gia cảnh hiện tại.
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                                <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" id="taxFileUpload" />
                                <label htmlFor="taxFileUpload" className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
                                    Chọn File Excel
                                </label>
                            </div>

                            <div className="text-sm text-slate-600">
                                Cột yêu cầu: MaNV, TongThuNhap, KhgChiuThue, BaoHiem
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-slate-600">Đang xử lý dữ liệu và tính toán...</p>
                        </div>
                    )}
                </div>
            </Modal>

            {detailModalData && (
                <TaxDetailModal
                    isOpen={!!detailModalData}
                    onClose={() => setDetailModalData(null)}
                    employeeName={detailModalData.name}
                    taxableIncome={detailModalData.taxable}
                />
            )}
        </div>
    )
}
