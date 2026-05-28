'use client';

import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, CreditCard } from 'lucide-react';

export default function PrintInvoicePage() {
    const [invoiceData, setInvoiceData] = useState<any>(null);

    useEffect(() => {
        const dataStr = localStorage.getItem('print_invoice_data');
        if (dataStr) {
            try {
                setInvoiceData(JSON.parse(dataStr));
            } catch (e) {
                console.error('Error parsing print invoice data:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (invoiceData) {
            // Tự động kích hoạt hộp thoại in sau khi dữ liệu đã sẵn sàng
            const timer = setTimeout(() => {
                window.print();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [invoiceData]);

    if (!invoiceData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <p className="text-gray-500 font-bold">Không tìm thấy dữ liệu hóa đơn cần in.</p>
                <button 
                    onClick={() => window.location.href = '/pos'}
                    className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold"
                >
                    Quay lại POS
                </button>
            </div>
        );
    }

    const { tableName, orders, totals, paymentMethod, paymentUrl } = invoiceData;
    const { subTotal, totalDiscount, finalTotal } = totals;

    // Phẳng hóa danh sách món ăn
    const itemsMap: { [key: string]: { name: string; quantity: number; price: number } } = {};
    orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
            const name = item.menuItem.name;
            const price = item.priceAtTime || item.menuItem.price || 0;
            const key = `${name}_${price}`;
            if (itemsMap[key]) {
                itemsMap[key].quantity += item.quantity;
            } else {
                itemsMap[key] = { name, quantity: item.quantity, price };
            }
        });
    });
    const items = Object.values(itemsMap);
    const dateStr = new Date().toLocaleString('vi-VN');
    const invoiceCode = `HD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const handleContinue = () => {
        if ((paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') && paymentUrl) {
            // Chuyển hướng sang trang thanh toán QR
            window.location.href = paymentUrl;
        } else {
            // Thanh toán tiền mặt thành công -> quay lại POS
            window.location.href = '/pos';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header điều khiển (Ẩn khi in) */}
            <div className="print:hidden w-full bg-white border-b border-gray-200 py-6 px-8 sticky top-0 z-50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.location.href = '/pos'}
                        className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase">Trình in Hóa Đơn</h2>
                        <p className="text-sm text-gray-500 font-medium">Bàn {tableName} - Tổng: {finalTotal.toLocaleString()}đ</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => window.print()}
                        className="flex-1 sm:flex-none px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                        <Printer className="w-4 h-4" /> In Lại
                    </button>

                    <button 
                        onClick={handleContinue}
                        className={`flex-1 sm:flex-none px-8 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]
                            ${(paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') && paymentUrl 
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                                : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                    >
                        {((paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') && paymentUrl) ? (
                            <>
                                <CreditCard className="w-4 h-4" /> Tiếp Tục Thanh Toán QR
                            </>
                        ) : (
                            'Hoàn Tất & Quay Lại POS'
                        )}
                    </button>
                </div>
            </div>

            {/* Vùng hiển thị hóa đơn nháp (K80 80mm) */}
            <div className="flex-1 flex items-start justify-center p-6 print:p-0 print:bg-white bg-gray-100 overflow-y-auto">
                <div className="w-[80mm] min-h-[120mm] bg-white shadow-md rounded-2xl p-6 print:shadow-none print:rounded-none print:p-2 border border-gray-100 print:border-0 font-mono text-[12px] leading-relaxed text-black">
                    <div className="text-center">
                        <div className="text-base font-bold uppercase tracking-tight">THẮNG RESTAURANT</div>
                        <div className="text-[10px] text-gray-600 mt-1 leading-tight">ĐC: 575 Phạm Văn Đồng, Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội<br />ĐT: 0987.654.321</div>
                        <div className="font-bold uppercase text-sm mt-4 border-t border-b border-dashed border-black py-1">HÓA ĐƠN THANH TOÁN</div>
                        <div className="text-[10px] mt-1 text-gray-500">Mã HĐ: {invoiceCode}</div>
                    </div>

                    <div className="border-b border-dashed border-black my-4"></div>

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Bàn:</span>
                            <span className="font-bold uppercase">{tableName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Thời gian:</span>
                            <span>{dateStr}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Hình thức:</span>
                            <span className="font-bold">
                                {paymentMethod === 'VNPAY' ? 'VNPay QR' : paymentMethod === 'MOMO' ? 'Ví MoMo' : 'Tiền mặt'}
                            </span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-black my-4"></div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-dashed border-black font-bold">
                                <th className="pb-2" style={{ width: '50%' }}>Tên món</th>
                                <th className="text-center pb-2" style={{ width: '15%' }}>SL</th>
                                <th className="text-right pb-2" style={{ width: '35%' }}>T.Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item: any, idx: number) => (
                                <tr key={idx} className="align-top">
                                    <td className="py-2">
                                        <div>{item.name}</div>
                                        <div className="text-[10px] text-gray-500">{item.price.toLocaleString()}đ</div>
                                    </td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-right font-bold py-2">{(item.price * item.quantity).toLocaleString()}đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-b border-dashed border-black my-4"></div>

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Cộng tiền món:</span>
                            <span>{subTotal.toLocaleString()}đ</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="flex justify-between font-bold">
                                <span>Giảm giá:</span>
                                <span>-{totalDiscount.toLocaleString()}đ</span>
                            </div>
                        )}
                        <div className="border-t border-double border-black my-2"></div>
                        <div className="flex justify-between text-sm font-bold">
                            <span>TỔNG CỘNG:</span>
                            <span>{finalTotal.toLocaleString()}đ</span>
                        </div>
                    </div>

                    <div className="border-t border-double border-black my-4"></div>

                    <div className="text-center space-y-1 mt-6 text-[10px]">
                        <div className="font-bold text-xs uppercase">Cảm ơn quý khách & hẹn gặp lại!</div>
                        <div className="italic text-gray-500">Powered by DATN Thắng System</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
