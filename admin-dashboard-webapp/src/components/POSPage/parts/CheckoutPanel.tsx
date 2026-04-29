'use client';

import React from 'react';
import { Receipt } from 'lucide-react';

interface CheckoutPanelProps {
    totals: {
        subTotal: number;
        totalDiscount: number;
        finalTotal: number;
    };
    canCheckout: boolean;
    onCheckout: () => void;
    isPartial?: boolean;
}

export default function CheckoutPanel({ totals, canCheckout, onCheckout, isPartial }: CheckoutPanelProps) {
    const { subTotal, totalDiscount, finalTotal } = totals;

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
                
                <div className="flex justify-between items-center">
                    <div>
                        <span className="font-black text-gray-400 uppercase tracking-widest text-lg block">TỔNG CỘNG</span>
                        {isPartial && (
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded">Đang tách đơn</span>
                        )}
                    </div>
                    <span className="text-4xl font-black text-gray-900">{finalTotal.toLocaleString()}đ</span>
                </div>
            </div>
            <div className="flex gap-4">
                <button 
                    disabled={!canCheckout}
                    onClick={onCheckout}
                    className={`flex-1 py-5 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:grayscale active:scale-[0.98]
                        ${isPartial ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}
                    `}
                >
                    <Receipt className="w-6 h-6" />
                    {finalTotal === 0 ? 'DỌN BÀN & KẾT THÚC' : isPartial ? 'THANH TOÁN ĐƠN ĐÃ CHỌN' : 'TÍNH TIỀN & DỌN BÀN'}
                </button>
            </div>
        </div>
    );
}
