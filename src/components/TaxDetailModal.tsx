import { useMemo } from 'react'
import Modal from './Modal'
import { getTaxDetails, formatCurrency } from '../utils/tax'

interface TaxDetailModalProps {
    isOpen: boolean
    onClose: () => void
    employeeName: string
    taxableIncome: number
}

export default function TaxDetailModal({ isOpen, onClose, employeeName, taxableIncome }: TaxDetailModalProps) {
    const details = useMemo(() => getTaxDetails(taxableIncome), [taxableIncome])

    // Calculate totals for the footer
    const totalTaxableInBrackets = details.reduce((sum, item) => sum + item.taxableAmount, 0)
    // totalTax passed in prop should match sum of details.taxAmount, but we can re-sum to be safe or just use the prop.
    // Let's re-sum to be strictly consistent with the table.
    const calculatedTotalTax = details.reduce((sum, item) => sum + item.taxAmount, 0)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết thuế TNCN - ${employeeName}`} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <h4 className="text-primary-600 font-medium">(*) Chi tiết thuế thu nhập cá nhân (VNĐ)</h4>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                            <tr>
                                <th className="p-3">Mức chịu thuế</th>
                                <th className="p-3 text-center">Thuế suất</th>
                                <th className="p-3 text-right">Lương chịu thuế</th>
                                <th className="p-3 text-right">Tiền nộp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {details.map((item) => (
                                <tr key={item.level} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-700">{item.range}</td>
                                    <td className="p-3 text-center text-slate-600">{Math.round(item.rate * 100)}%</td>
                                    <td className="p-3 text-right text-slate-600">
                                        {item.taxableAmount > 0 ? formatCurrency(item.taxableAmount) : '0'}
                                    </td>
                                    <td className="p-3 text-right text-slate-800 font-medium">
                                        {item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '0'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t">
                            <tr>
                                <td colSpan={2} className="p-3 text-slate-700 text-right">Tổng cộng</td>
                                <td className="p-3 text-right text-slate-800">{formatCurrency(totalTaxableInBrackets)}</td>
                                <td className="p-3 text-right text-primary-600">{formatCurrency(calculatedTotalTax)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-1">
                    <p><strong>Thu nhập tính thuế:</strong> Là phần thu nhập còn lại sau khi trừ các khoản miễn thuế, bảo hiểm và giảm trừ gia cảnh.</p>
                    <p><strong>Công thức:</strong> Thuế TNCN = Tổng (Lương chịu thuế ở từng bậc × Thuế suất tương ứng)</p>
                </div>
            </div>
        </Modal>
    )
}
