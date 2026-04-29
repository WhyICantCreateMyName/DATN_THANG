'use client';

import React from 'react';
import { Receipt, Wallet, CreditCard } from 'lucide-react';

interface CheckoutPanelProps {
    totals: {
        subTotal: number;
        totalDiscount: number;
        finalTotal: number;
    };
    canCheckout: boolean;
    onCheckout: (method: string) => void;
    isPartial?: boolean;
}

export default function CheckoutPanel({ totals, canCheckout, onCheckout, isPartial }: CheckoutPanelProps) {
    const { subTotal, totalDiscount, finalTotal } = totals;
    const [method, setMethod] = React.useState('CASH');

    return (
        <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="space-y-2 mb-6">
                {totalDiscount > 0 && (
                    <>
                        <div className="flex justify-between items-center text-gray-500 font-bold text-sm px-2">
                            <span>Tạm tính:</span>
                            <span>{subTotal.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between items-center text-green-600 font-bold text-sm px-2">
                            <span>Giảm giá (Voucher):</span>
                            <span>-{totalDiscount.toLocaleString()}đ</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2" />
                    </>
                )}
                
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <span className="font-black text-gray-400 uppercase tracking-widest text-lg block">TỔNG CỘNG</span>
                        {isPartial && (
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded">Đang tách đơn</span>
                        )}
                    </div>
                    <span className="text-4xl font-black text-gray-900">{finalTotal.toLocaleString()}đ</span>
                </div>

                {finalTotal > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button 
                            onClick={() => setMethod('CASH')}
                            className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                ${method === 'CASH' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}
                            `}
                        >
                            <Wallet className="w-4 h-4" /> Tiền mặt
                        </button>
                        <button 
                            onClick={() => setMethod('E_WALLET')}
                            className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                ${method === 'E_WALLET' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}
                            `}
                        >
                            <CreditCard className="w-4 h-4" /> VNPay (QR)
                        </button>
                    </div>
                )}
            </div>
            <div className="flex gap-4">
                <button 
                    disabled={!canCheckout}
                    onClick={() => onCheckout(method)}
                    className={`flex-1 py-5 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:grayscale active:scale-[0.98]
                        ${method === 'E_WALLET' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : (isPartial ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20')}
                    `}
                >
                    <Receipt className="w-6 h-6" />
                    {finalTotal === 0 ? 'DỌN BÀN & KẾT THÚC' : (method === 'E_WALLET' ? 'THANH TOÁN VNPAY' : (isPartial ? 'THANH TOÁN ĐƠN ĐÃ CHỌN' : 'TÍNH TIỀN & DỌN BÀN'))}
                </button>
            </div>
        </div>
    );
}
