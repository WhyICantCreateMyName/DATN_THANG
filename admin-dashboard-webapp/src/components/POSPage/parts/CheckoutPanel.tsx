'use client';

import React from 'react';
import { Receipt } from 'lucide-react';

interface CheckoutPanelProps {
    total: number;
    canCheckout: boolean;
    onCheckout: () => void;
}

export default function CheckoutPanel({ total, canCheckout, onCheckout }: CheckoutPanelProps) {
    return (
        <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <span className="font-black text-gray-400 uppercase tracking-widest text-lg">TỔNG CỘNG</span>
                <span className="text-4xl font-black text-gray-900">{total.toLocaleString()}đ</span>
            </div>
            <div className="flex gap-4">
                <button 
                    disabled={!canCheckout}
                    onClick={onCheckout}
                    className="flex-1 py-5 bg-orange-500 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
                >
                    <Receipt className="w-6 h-6" />
                    TÍNH TIỀN & DỌN BÀN
                </button>
            </div>
        </div>
    );
}
