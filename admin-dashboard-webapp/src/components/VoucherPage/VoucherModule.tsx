'use client';

import React, { useState } from 'react';
import { Ticket, Plus, Search, Filter, Edit2, Trash2, Calendar, CheckCircle2, XCircle, Tag, Info } from 'lucide-react';
import { useVouchers } from '@/hooks/useVouchers';
import { voucherService, Voucher } from '@/services/voucher.service';
import Pagination from '@/components/ui/Pagination';
import VoucherFormModal from './parts/VoucherFormModal';

export default function VoucherModule() {
    const { vouchers, meta, page, setPage, isLoading, mutateVouchers } = useVouchers();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Bạn có chắc muốn xóa voucher ${code}?`)) return;
        try {
            await voucherService.deleteVoucher(id);
            mutateVouchers();
        } catch (error) {
            alert('Lỗi khi xóa voucher');
        }
    };

    const handleToggleStatus = async (voucher: Voucher) => {
        try {
            const response = await voucherService.updateVoucher(voucher.id, { isActive: !voucher.isActive });
            mutateVouchers();
        } catch (error: any) {
            console.error('[ERROR] Lỗi khi cập nhật trạng thái voucher:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            alert('Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-120px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <Ticket className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Quản lý Voucher & Khuyến mãi</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Tạo và điều phối các chương trình ưu đãi khách hàng</p>
                    </div>
                </div>
                <button
                    onClick={() => { setSelectedVoucher(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Tạo Voucher Mới
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                    <th className="px-6 py-4 font-semibold">Voucher</th>
                                    <th className="px-6 py-4 font-semibold">Mức Giảm</th>
                                    <th className="px-6 py-4 font-semibold">Điều kiện</th>
                                    <th className="px-6 py-4 font-semibold">Sử dụng</th>
                                    <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vouchers.map((v: Voucher) => (
                                    <tr key={v.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{v.code}</div>
                                                    <div className="text-xs text-gray-400 max-w-[200px] truncate">{v.description || 'Không có mô tả'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">
                                                {v.discountType === 'FIXED'
                                                    ? `${v.discountValue.toLocaleString('vi-VN')}đ`
                                                    : `${v.discountValue}%`
                                                }
                                            </div>
                                            {v.maxDiscount && (
                                                <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-tighter font-medium">Tối đa: {v.maxDiscount.toLocaleString('vi-VN')}đ</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-medium text-gray-600">Min: {v.minOrderValue.toLocaleString('vi-VN')}đ</div>
                                                {v.conditions?.map((c: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                                        <Info className="w-3 h-3" />
                                                        {c.type === 'NEW_USER' ? 'KHÁCH MỚI' : c.type === 'MIN_ORDERS' ? `>${c.value} ĐƠN` : c.type}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500"
                                                        style={{ width: `${v.usageLimit ? (v.usedCount / v.usageLimit) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500">
                                                    {v.usedCount} / {v.usageLimit || '∞'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={v.isActive}
                                                        onChange={() => handleToggleStatus(v)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                                                </label>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => { setSelectedVoucher(v); setIsModalOpen(true); }}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(v.id, v.code)}
                                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={page}
                        totalPages={meta?.totalPages || 0}
                        onPageChange={setPage}
                        totalItems={meta?.total}
                    />
                </div>
            </div>

            {isModalOpen && (
                <VoucherFormModal
                    voucher={selectedVoucher}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); mutateVouchers(); }}
                />
            )}
        </div>
    );
}
