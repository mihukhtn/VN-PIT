import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'
import { ArrowLeft, Plus, Edit2, Trash, User } from 'lucide-react'
import Modal from '../components/Modal'

type Employee = Database['public']['Tables']['employees']['Row']
type Dependent = Database['public']['Tables']['dependents']['Row']
type NewDependent = Database['public']['Tables']['dependents']['Insert']

export default function EmployeeDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [dependents, setDependents] = useState<Dependent[]>([])
    const [loading, setLoading] = useState(true)

    // Edit Employee State
    const [editMode, setEditMode] = useState(false)
    const [empFormData, setEmpFormData] = useState<Partial<Employee>>({})

    // Dependent Modal State
    const [depModalOpen, setDepModalOpen] = useState(false)
    const [currentDep, setCurrentDep] = useState<Partial<NewDependent>>({})
    const [depSaving, setDepSaving] = useState(false)

    const fetchData = async () => {
        if (!id) return
        setLoading(true)

        // Fetch Employee
        const { data: emp, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single()

        if (empError) {
            alert('Không tìm thấy nhân viên!')
            navigate('/')
            return
        }
        setEmployee(emp)
        setEmpFormData(emp)

        // Fetch Dependents
        const { data: deps, error: depError } = await supabase
            .from('dependents')
            .select('*')
            .eq('employee_id', id)
            .order('created_at', { ascending: false })

        if (!depError) setDependents(deps || [])

        setLoading(false)
    }

    useEffect(() => { fetchData() }, [id])

    const handleUpdateEmployee = async () => {
        if (!employee || !empFormData) return
        const { error } = await supabase
            .from('employees')
            .update(empFormData)
            .eq('id', employee.id)

        if (error) alert('Lỗi: ' + error.message)
        else {
            setEmployee(empFormData as Employee)
            setEditMode(false)
            alert('Đã cập nhật thông tin nhân viên!')
        }
    }

    const handleSaveDependent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return
        if (!currentDep.full_name || !currentDep.relation || !currentDep.deduction_start_month) {
            alert('Vui lòng nhập đủ thông tin bắt buộc')
            return
        }

        setDepSaving(true)

        // Format dates to YYYY-MM-01
        const formatMonth = (val: string | undefined) => val ? `${val}-01` : null

        const payload: NewDependent = {
            ...(currentDep as NewDependent),
            employee_id: id,
            deduction_start_month: formatMonth(currentDep.deduction_start_month) as string,
            deduction_end_month: currentDep.deduction_end_month ? formatMonth(currentDep.deduction_end_month) : null
        }

        // Remove id from payload if it's undefined (new insert)
        if (!currentDep.id) {
            delete (payload as any).id
        }

        let error
        if (currentDep.id) {
            const { error: err } = await supabase.from('dependents').update(payload).eq('id', currentDep.id)
            error = err
        } else {
            const { error: err } = await supabase.from('dependents').insert([payload])
            error = err
        }

        if (error) alert('Lỗi lưu người phụ thuộc: ' + error.message)
        else {
            setDepModalOpen(false)
            fetchData()
        }
        setDepSaving(false)
    }

    const handleDeleteDependent = async (depId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa người phụ thuộc này?')) return
        const { error } = await supabase.from('dependents').delete().eq('id', depId)
        if (error) alert('Lỗi xóa: ' + error.message)
        else fetchData()
    }

    const openAddDep = () => {
        setCurrentDep({
            full_name: '',
            relation: 'Con',
            is_active: true,
            deduction_start_month: new Date().toISOString().slice(0, 7) // YYYY-MM
        } as any)
        setDepModalOpen(true)
    }

    const openEditDep = (dep: Dependent) => {
        setCurrentDep({
            ...dep,
            deduction_start_month: dep.deduction_start_month.slice(0, 7),
            deduction_end_month: dep.deduction_end_month ? dep.deduction_end_month.slice(0, 7) : ''
        } as any)
        setDepModalOpen(true)
    }

    if (loading) return <div className="p-8 text-center">Đang tải...</div>
    if (!employee) return null

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 transition-colors">
                <ArrowLeft size={20} /> Quay lại danh sách
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <User size={18} /> Thông tin nhân viên
                            </h2>
                            {!editMode ? (
                                <button onClick={() => setEditMode(true)} className="text-primary-600 hover:bg-primary-50 p-1 rounded"><Edit2 size={18} /></button>
                            ) : (
                                <div className="flex gap-1">
                                    <button onClick={handleUpdateEmployee} className="text-green-600 hover:bg-green-50 p-1 rounded font-bold">Lưu</button>
                                    <button onClick={() => { setEditMode(false); setEmpFormData(employee) }} className="text-slate-500 hover:bg-slate-100 p-1 rounded">Hủy</button>
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Mã NV</label>
                                {editMode ? (
                                    <input className="w-full border rounded p-1" value={empFormData.code} onChange={e => setEmpFormData({ ...empFormData, code: e.target.value })} />
                                ) : <p className="font-medium text-slate-900">{employee.code}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Họ Tên</label>
                                {editMode ? (
                                    <input className="w-full border rounded p-1" value={empFormData.full_name} onChange={e => setEmpFormData({ ...empFormData, full_name: e.target.value })} />
                                ) : <p className="font-medium text-slate-900 text-lg">{employee.full_name}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Đơn Vị</label>
                                {editMode ? (
                                    <input className="w-full border rounded p-1" value={empFormData.unit || ''} onChange={e => setEmpFormData({ ...empFormData, unit: e.target.value })} />
                                ) : <p className="font-medium text-slate-900">{employee.unit || '-'}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Mã số thuế</label>
                                {editMode ? (
                                    <input className="w-full border rounded p-1" value={empFormData.tax_code || ''} onChange={e => setEmpFormData({ ...empFormData, tax_code: e.target.value })} />
                                ) : <p className="font-mono text-slate-900">{employee.tax_code || '-'}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">CCCD</label>
                                {editMode ? (
                                    <input className="w-full border rounded p-1" value={empFormData.cccd || ''} onChange={e => setEmpFormData({ ...empFormData, cccd: e.target.value })} />
                                ) : <p className="font-mono text-slate-900">{employee.cccd || '-'}</p>}
                            </div>

                            <div className="pt-2 border-t">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" disabled={!editMode} checked={empFormData.is_active || false}
                                        onChange={e => setEmpFormData({ ...empFormData, is_active: e.target.checked })}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <span className={`text-sm font-medium ${empFormData.is_active ? 'text-green-600' : 'text-slate-500'}`}>
                                        {empFormData.is_active ? 'Đang làm việc' : 'Đã nghỉ việc'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dependents Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <User size={18} className="text-primary-600" />
                                Người phụ thuộc ({dependents.length})
                            </h2>
                            <button onClick={openAddDep} className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded shadow-sm hover:bg-primary-700 transition">
                                <Plus size={16} /> Thêm mới
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b">
                                    <tr>
                                        <th className="p-4 text-xs font-semibold uppercase text-slate-500">Họ tên</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-slate-500">Quan hệ</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-slate-500">Ngày sinh</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-slate-500">MST</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-slate-500">Giảm trừ</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-slate-500 text-right">#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dependents.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">Chưa có người phụ thuộc</td></tr>
                                    ) : (
                                        dependents.map(dep => (
                                            <tr key={dep.id} className={`border-b last:border-0 hover:bg-slate-50 ${!dep.is_active ? 'opacity-50 bg-slate-50' : ''}`}>
                                                <td className="p-4 font-medium text-slate-900">{dep.full_name}</td>
                                                <td className="p-4 text-slate-600">{dep.relation}</td>
                                                <td className="p-4 text-slate-600 whitespace-nowrap">{dep.birth_date ? new Date(dep.birth_date).toLocaleDateString('vi-VN') : '-'}</td>
                                                <td className="p-4 font-mono text-xs text-slate-600">{dep.tax_code || '-'}</td>
                                                <td className="p-4 text-sm text-slate-600">
                                                    <div className="flex flex-col">
                                                        <span>Từ: {dep.deduction_start_month.slice(0, 7)}</span>
                                                        {dep.deduction_end_month && <span className="text-slate-400">Đến: {dep.deduction_end_month.slice(0, 7)}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right whitespace-nowrap">
                                                    <button onClick={() => openEditDep(dep)} className="p-1 text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteDependent(dep.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"><Trash size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dependent Modal */}
            <Modal isOpen={depModalOpen} onClose={() => setDepModalOpen(false)} title={currentDep.id ? "Cập nhật người phụ thuộc" : "Thêm người phụ thuộc"}>
                <form onSubmit={handleSaveDependent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
                        <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                            value={currentDep.full_name || ''} onChange={e => setCurrentDep({ ...currentDep, full_name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quan hệ *</label>
                            <select className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={currentDep.relation || 'Con'} onChange={e => setCurrentDep({ ...currentDep, relation: e.target.value })}>
                                <option value="Con">Con</option>
                                <option value="Vợ/Chồng">Vợ/Chồng</option>
                                <option value="Cha/Mẹ">Cha/Mẹ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                            <input type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={currentDep.birth_date || ''} onChange={e => setCurrentDep({ ...currentDep, birth_date: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mã số thuế</label>
                            <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={currentDep.tax_code || ''} onChange={e => setCurrentDep({ ...currentDep, tax_code: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CCCD/CMND</label>
                            <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={currentDep.cccd || ''} onChange={e => setCurrentDep({ ...currentDep, cccd: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tháng bắt đầu giảm trừ *</label>
                            <input type="month" required className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={(currentDep as any).deduction_start_month || ''} onChange={e => setCurrentDep({ ...currentDep, deduction_start_month: e.target.value } as any)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tháng kết thúc (nếu có)</label>
                            <input type="month" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                value={(currentDep as any).deduction_end_month || ''} onChange={e => setCurrentDep({ ...currentDep, deduction_end_month: e.target.value } as any)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="depActive" checked={currentDep.is_active ?? true}
                            onChange={e => setCurrentDep({ ...currentDep, is_active: e.target.checked })}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                        <label htmlFor="depActive" className="text-sm text-slate-700">Đang được tính giảm trừ</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setDepModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                        <button type="submit" disabled={depSaving} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                            {depSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
