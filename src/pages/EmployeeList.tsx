import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'
import { Plus, FileSpreadsheet, Search, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'

type Employee = Database['public']['Tables']['employees']['Row']
type NewEmployee = Database['public']['Tables']['employees']['Insert']

export default function EmployeeList() {
    const navigate = useNavigate()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [formData, setFormData] = useState<Partial<NewEmployee>>({
        code: '', full_name: '', unit: '', tax_code: '', cccd: '', is_active: true
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchEmployees = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) console.error(error)
        else setEmployees(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchEmployees() }, [])

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const { error } = await supabase.from('employees').insert([formData as NewEmployee])
        if (error) {
            alert('Lỗi thêm nhân viên: ' + error.message)
        } else {
            setIsAddOpen(false)
            setFormData({ code: '', full_name: '', unit: '', tax_code: '', cccd: '', is_active: true })
            fetchEmployees()
        }
        setSubmitting(false)
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                // Map data
                const importedEmployees: NewEmployee[] = data.map(row => ({
                    code: row['MaNV'] || row['Mã NV'] || row['Code'] || '',
                    full_name: row['HoTen'] || row['Họ Tên'] || row['Name'] || 'Không tên',
                    unit: row['DonVi'] || row['Đơn Vị'] || row['Unit'] || null,
                    tax_code: row['MST'] || row['MaSoThue'] ? String(row['MST'] || row['MaSoThue']) : null,
                    cccd: row['CCCD'] || row['CMND'] ? String(row['CCCD'] || row['CMND']) : null,
                    is_active: true
                })).filter(e => e.code) // Must have code

                if (importedEmployees.length === 0) {
                    alert('Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra tên cột (MaNV, HoTen, ...)')
                    return
                }

                const { error } = await supabase.from('employees').upsert(importedEmployees, { onConflict: 'code' })
                if (error) throw error

                alert(`Đã import thành công ${importedEmployees.length} nhân viên!`)
                setIsImportOpen(false)
                fetchEmployees()
            } catch (err: any) {
                alert('Lỗi import: ' + err.message)
            }
        }
        reader.readAsBinaryString(file)
    }

    const navigateToDetail = (id: string) => {
        // For now, we don't have detail page wired, but we will soon.
        navigate(`/employees/${id}`)
    }

    const filtered = employees.filter(e =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân sự</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsImportOpen(true)} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm font-medium">
                        <FileSpreadsheet size={18} /> Import Excel
                    </button>
                    <button onClick={() => setIsAddOpen(true)} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium">
                        <Plus size={18} /> Thêm mới
                    </button>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mã nhân viên..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none shadow-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Mã NV</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Họ tên</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">Đơn vị</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm hidden lg:table-cell">MST</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Trạng thái</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu nhân viên</td></tr>
                            ) : (
                                filtered.map(emp => (
                                    <tr
                                        key={emp.id}
                                        onClick={() => navigateToDetail(emp.id)}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <td className="p-4 font-medium text-slate-700">{emp.code}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold border border-primary-200">
                                                    {emp.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-slate-900">{emp.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 hidden md:table-cell">{emp.unit || '-'}</td>
                                        <td className="p-4 text-slate-600 hidden lg:table-cell font-mono text-sm">{emp.tax_code || '-'}</td>
                                        <td className="p-4">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                                emp.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {emp.is_active ? 'Đang làm việc' : 'Đã nghỉ'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-slate-400 hover:text-primary-600 transition-colors">
                                                <Eye size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Thêm nhân viên mới">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mã NV *</label>
                            <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                            <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                        <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                            value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mã số thuế</label>
                            <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.tax_code || ''} onChange={e => setFormData({ ...formData, tax_code: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CCCD</label>
                            <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.cccd || ''} onChange={e => setFormData({ ...formData, cccd: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="isActive" checked={formData.is_active || false}
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                        <label htmlFor="isActive" className="text-sm text-slate-700">Đang làm việc</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                        <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                            {submitting ? 'Đang lưu...' : 'Lưu nhân viên'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Import Modal */}
            <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import từ Excel">
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                        <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                        <p className="text-sm text-slate-600 mb-4">Chọn file Excel (.xlsx, .xls) chứa danh sách nhân viên.</p>
                        <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" id="fileUpload" />
                        <label htmlFor="fileUpload" className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
                            Chọn File
                        </label>
                    </div>

                    <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
                        <strong>Lưu ý:</strong> File Excel cần có các cột:
                        <ul className="list-disc list-inside mt-1 ml-2">
                            <li>MaNV (bắt buộc)</li>
                            <li>HoTen (bắt buộc)</li>
                            <li>DonVi</li>
                            <li>MST (Mã số thuế)</li>
                            <li>CCCD</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setIsImportOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Đóng</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
