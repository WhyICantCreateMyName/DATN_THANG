import React from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, User, Calendar, Tag, ArrowDownRight, ClipboardList } from 'lucide-react';
import { StockTransaction } from '@/services/ingredient.service';
import Pagination from '@/components/ui/Pagination';

interface TransactionHistoryProps {
    transactions: StockTransaction[];
    page: number;
    meta: any;
    onPageChange: (page: number) => void;
}

export default function TransactionHistory({ transactions, page, meta, onPageChange }: TransactionHistoryProps) {
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'IMPORT': return { color: 'text-green-600', bg: 'bg-green-50', label: 'NHẬP KHO', icon: ArrowUpRight };
            case 'EXPORT': return { color: 'text-red-600', bg: 'bg-red-50', label: 'XUẤT KHO', icon: ArrowDownRight };
            case 'AUDIT_START':
            case 'AUDIT_END': return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'KIỂM KÊ', icon: ClipboardList };
            default: return { color: 'text-gray-600', bg: 'bg-gray-50', label: type, icon: History };
        }
    };

    return (
        <div className="space-y-6">
            <div className="px-2">
                <h3 className="text-lg font-bold text-gray-800">Lịch sử Biến động Kho</h3>
                <p className="text-xs text-gray-500">Theo dõi vết nhập/xuất nguyên vật liệu</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-6 py-4 font-semibold">Thời gian</th>
                                <th className="px-6 py-4 font-semibold">Loại</th>
                                <th className="px-6 py-4 font-semibold">Chi tiết giao dịch</th>
                                <th className="px-6 py-4 font-semibold">Số lượng</th>
                                <th className="px-6 py-4 font-semibold">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tr) => {
                                const styles = getTypeStyles(tr.type);
                                const Icon = styles.icon;
                                return (
                                    <tr key={tr.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">
                                                    {new Date(tr.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(tr.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide border ${styles.bg} ${styles.color} ${styles.color.replace('text', 'border').replace('-600', '-200')}`}>
                                                {styles.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-800">{tr.ingredient?.name}</span>
                                                    {(tr as any).supplier && (
                                                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100">
                                                            {(tr as any).supplier.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tr.note || 'Không có ghi chú'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-bold ${tr.type === 'IMPORT' ? 'text-green-600' : tr.type === 'EXPORT' ? 'text-red-600' : 'text-blue-600'}`}>
                                                {tr.type === 'EXPORT' ? '-' : '+'}{tr.quantity} <span className="text-[10px] font-medium text-gray-400 uppercase ml-1">{tr.ingredient?.unit}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                                                    {tr.user?.fullName?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">{tr.user?.fullName}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    totalPages={meta?.totalPages || 0}
                    onPageChange={onPageChange}
                    totalItems={meta?.total}
                />
            </div>
        </div>
    );
}
