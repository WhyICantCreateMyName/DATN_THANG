'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { invoiceService, Invoice } from '@/services/invoice.service';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
    const [isExporting, setIsExporting] = useState(false);

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
        setPage(1);
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

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const allInvoicesRes = await invoiceService.getInvoices({
                ...filters,
                page: 1,
                limit: 9999,
                minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
                maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined
            });
            const allInvoices = allInvoicesRes?.data || [];
            if (allInvoices.length === 0) return alert('Không có dữ liệu để xuất!');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Báo Cáo');
            const borderStyle: Partial<ExcelJS.Borders> = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            worksheet.mergeCells('A1:H1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'BÁO CÁO DOANH THU CHI TIẾT';
            titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).height = 35;

            worksheet.mergeCells('A2:H2');
            const metaCell = worksheet.getCell('A2');
            metaCell.value = `Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Kỳ báo cáo: ${filters.startDate || 'Tất cả'} - ${filters.endDate || 'Tất cả'}`;
            metaCell.font = { italic: true, size: 10 };
            metaCell.alignment = { horizontal: 'center' };

            worksheet.columns = [
                { key: 'stt', width: 8 },
                { key: 'id', width: 30 },
                { key: 'table', width: 12 },
                { key: 'date', width: 22 },
                { key: 'subTotal', width: 15 },
                { key: 'discount', width: 15 },
                { key: 'final', width: 18 },
                { key: 'method', width: 18 }
            ];

            const headerRow = worksheet.getRow(3);
            headerRow.values = ['STT', 'MÃ HÓA ĐƠN', 'BÀN', 'NGÀY GIỜ', 'TIỀN GỐC', 'GIẢM GIÁ', 'THỰC THU', 'PHƯƠNG THỨC'];
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
                cell.border = borderStyle;
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            headerRow.height = 25;

            allInvoices.forEach((inv, index) => {
                const row = worksheet.addRow({
                    stt: index + 1,
                    id: inv.id.toUpperCase(),
                    table: inv.table?.name || 'Mang về',
                    date: new Date(inv.issuedAt).toLocaleString('vi-VN'),
                    subTotal: inv.subTotal,
                    discount: inv.discount,
                    final: inv.finalAmount,
                    method: inv.paymentMethod === 'CASH' ? 'Tiền mặt' :
                        inv.paymentMethod === 'VNPAY' ? 'VNPay' :
                            inv.paymentMethod === 'MOMO' ? 'MoMo' :
                                inv.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Thanh toán thẻ',
                });
                row.eachCell((cell, colNumber) => {
                    cell.border = borderStyle;
                    if ([5, 6, 7].includes(colNumber)) {
                        cell.numFmt = '#,##0 "₫"';
                        cell.alignment = { horizontal: 'right' };
                    } else {
                        cell.alignment = { horizontal: 'center' };
                    }
                });
            });

            const lastDataRow = worksheet.lastRow!.number;
            const totalRow = worksheet.addRow([]);
            totalRow.getCell(1).value = 'TỔNG CỘNG:';
            worksheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);

            totalRow.getCell(5).value = { formula: `SUM(E4:E${lastDataRow})`, result: 0 };
            totalRow.getCell(6).value = { formula: `SUM(F4:F${lastDataRow})`, result: 0 };
            totalRow.getCell(7).value = { formula: `SUM(G4:G${lastDataRow})`, result: 0 };
            totalRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
                cell.border = borderStyle;
            });
            totalRow.getCell(1).alignment = { horizontal: 'center' };

            worksheet.addRow([]);
            const statsData = [
                ['THỐNG KÊ PHƯƠNG THỨC', '', ''],
                ['Số lượng tiền mặt:', '', { formula: `COUNTIF(H4:H${lastDataRow}, "Tiền mặt")`, result: 0 }],
                ['Số lượng VNPay:', '', { formula: `COUNTIF(H4:H${lastDataRow}, "VNPay")`, result: 0 }],
                ['Số lượng MoMo:', '', { formula: `COUNTIF(H4:H${lastDataRow}, "MoMo")`, result: 0 }],
                ['Số lượng chuyển khoản:', '', { formula: `COUNTIF(H4:H${lastDataRow}, "Chuyển khoản")`, result: 0 }],
            ];
            statsData.forEach((s, i) => {
                const r = worksheet.addRow(s);
                const rowNum = r.number;
                r.getCell(1).border = borderStyle;
                r.getCell(2).border = borderStyle;
                r.getCell(3).border = borderStyle;

                if (i === 0) {
                    worksheet.mergeCells(`A${rowNum}:C${rowNum}`);
                    r.getCell(1).value = 'THỐNG KÊ PHƯƠNG THỨC';
                    r.getCell(1).font = { bold: true };
                    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
                    r.getCell(1).alignment = { horizontal: 'center' };
                } else {
                    worksheet.mergeCells(`A${rowNum}:B${rowNum}`);
                    r.getCell(1).alignment = { horizontal: 'left' };
                    r.getCell(3).font = { bold: true };
                    r.getCell(3).alignment = { horizontal: 'center' };
                }
            });
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Bao_cao_doanh_thu_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Lỗi khi xuất Excel:', error);
            alert('Có lỗi xảy ra khi xuất dữ liệu!');
        } finally {
            setIsExporting(false);
        }
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
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isExporting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
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
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Số tiền tối thiểu</label>
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
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Số tiền tối đa</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                name="maxAmount"
                                placeholder="999,999,999"
                                value={filters.maxAmount}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">SĐT khách hàng</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="customerPhone"
                                placeholder="09xxxxxxxx"
                                value={filters.customerPhone}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Phương thức</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                name="paymentMethod"
                                value={filters.paymentMethod}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none font-medium"
                            >
                                <option value="">Tất cả</option>
                                <option value="CASH">Tiền mặt</option>
                                <option value="VNPAY">VNPay</option>
                                <option value="MOMO">MoMo</option>
                                <option value="TRANSFER">Chuyển khoản</option>
                                <option value="CARD">Thanh toán thẻ</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={resetFilters}
                        className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                        Xóa bộ lọc
                    </button>
                    <button
                        onClick={() => setPage(1)}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                    >
                        Lọc báo cáo
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Mã hóa đơn</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Bàn</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ngày giờ</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Tổng tiền</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Phương thức</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <TableIcon className="w-12 h-12" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Không có dữ liệu hóa đơn</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">#{inv.id.substring(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                                                    {inv.table?.name || '?'}
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">Bàn {inv.table?.name || '...'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-gray-900">{format(new Date(inv.issuedAt), 'dd/MM/yyyy')}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{format(new Date(inv.issuedAt), 'HH:mm:ss')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-emerald-600">{inv.finalAmount.toLocaleString()} ₫</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${inv.paymentMethod === 'VNPAY' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {inv.paymentMethod === 'VNPAY' ? 'VNPay' : inv.paymentMethod === 'MOMO' ? 'MoMo' : inv.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : inv.paymentMethod === 'CARD' ? 'Thanh toán thẻ' : inv.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Tiền mặt'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-gray-50">
                    <Pagination
                        page={page}
                        totalPages={meta?.totalPages || 1}
                        onPageChange={setPage}
                        totalItems={meta?.total}
                    />
                </div>
            </div>
        </div>
    );
}
