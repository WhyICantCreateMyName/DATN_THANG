'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { invoiceService, Invoice } from '@/services/invoice.service';
import {
    Search,
    Filter,
    Calendar,
    DollarSign,
    Phone,
    CreditCard,
    Download,
    ChevronRight,
    Table as TableIcon,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Pagination from '@/components/ui/Pagination';

export default function ReportModule() {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        customerPhone: '',
        paymentMethod: ''
    });
    const [page, setPage] = useState(1);

    const { data: res, isLoading, mutate } = useSWR(
        ['invoices', filters, page],
        () => invoiceService.getInvoices({
            ...filters,
            page,
            limit: 10,
            minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
            maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined
        })
    );

    const invoices = res?.data || [];
    const meta = res?.meta;

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Reset về trang 1 khi lọc
    };

    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            customerPhone: '',
            paymentMethod: ''
        });
        setPage(1);
    };

    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.finalAmount, 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Thống kê doanh thu</h1>
                    <p className="text-sm text-gray-500 font-medium italic">Theo dõi và phân tích hiệu quả kinh doanh</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tổng doanh thu kỳ này</span>
                        <span className="text-xl font-black">{totalRevenue.toLocaleString()} ₫</span>
                    </div>
                    <button
                        onClick={() => mutate()}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:shadow-md transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200">
                        <Download className="w-4 h-4" />
                        Xuất Excel
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest">
                    <Filter className="w-4 h-4 text-blue-600" />
                    Bộ lọc báo cáo
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Từ ngày</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Đến ngày</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Giá từ</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                name="minAmount"
                                placeholder="0"
                                value={filters.minAmount}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Đến mức</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                name="maxAmount"
                                placeholder="Tối đa"
                                value={filters.maxAmount}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">SĐT Khách</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="customerPhone"
                                placeholder="Tìm SĐT..."
                                value={filters.customerPhone}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Thanh toán</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                name="paymentMethod"
                                value={filters.paymentMethod}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none"
                            >
                                <option value="">Tất cả</option>
                                <option value="CASH">Tiền mặt</option>
                                <option value="CARD">Thẻ / Chuyển khoản</option>
                                <option value="E_WALLET">Ví điện tử</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={resetFilters}
                        className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã hóa đơn</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Bàn</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Phương thức</th>
                            <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-6 py-8">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : invoices?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Không tìm thấy dữ liệu phù hợp</p>
                                </td>
                            </tr>
                        ) : (
                            invoices?.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black text-gray-900 uppercase">#{inv.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">
                                                {format(new Date(inv.issuedAt), 'dd/MM/yyyy')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                {format(new Date(inv.issuedAt), 'HH:mm')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase">
                                            Bàn {inv.table?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-800">
                                                {inv.customerPhone}
                                            </span>
                                            <span className="text-[10px] text-gray-400 italic">
                                                {inv.itemCount} món ăn
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${inv.paymentMethod === 'CASH' ? 'bg-amber-50 text-amber-600' :
                                            inv.paymentMethod === 'CARD' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                            }`}>
                                            {inv.paymentMethod === 'CASH' ? 'Tiền mặt' :
                                                inv.paymentMethod === 'CARD' ? 'Chuyển khoản' : 'Ví điện tử'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-sm font-black text-gray-900">{inv.finalAmount.toLocaleString()} ₫</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {meta && meta.totalPages > 0 && (
                    <div className="p-6 bg-gray-50/30 border-t border-gray-100">
                        <Pagination
                            page={page}
                            totalPages={meta.totalPages}
                            onPageChange={setPage}
                            totalItems={meta.total}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
