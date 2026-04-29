'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Ticket, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/services/axios';
import { useAuth } from '@/contexts/AuthContext';

interface Voucher {
    id: string;
    code: string;
    description?: string;
    discountType: 'FIXED' | 'PERCENTAGE';
    discountValue: number;
    maxDiscount?: number;
    minOrderValue: number;
    isReachedCustomerLimit?: boolean;
}

interface VoucherPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (voucher: Voucher) => void;
    currentTotal: number;
    selectedVoucherId?: string;
}

export default function VoucherPickerModal({ isOpen, onClose, onSelect, currentTotal, selectedVoucherId }: VoucherPickerModalProps) {
    const { customer } = useAuth();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchVouchers = async () => {
                try {
                    const res = await api.get('/vouchers/active', {
                        params: { phone: customer?.phone }
                    });
                    setVouchers(res.data);
                } catch (error) {
                    console.error('Lỗi lấy voucher:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVouchers();
        }
    }, [isOpen, customer]);

    const isEligible = (v: Voucher) => {
        return currentTotal >= v.minOrderValue && !v.isReachedCustomerLimit;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed bottom-0 inset-x-0 bg-white rounded-t-[3rem] z-[110] flex flex-col max-h-[80vh] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-800">Chọn ưu đãi</h2>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">Khuyến mãi đang diễn ra</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                            {isLoading ? (
                                <div className="text-center py-20 animate-pulse">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold">Đang tìm ưu đãi...</p>
                                </div>
                            ) : vouchers.length === 0 ? (
                                <div className="text-center py-20">
                                    <Ticket className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold">Hiện chưa có khuyến mãi nào</p>
                                </div>
                            ) : (
                                vouchers.map((v) => {
                                    const eligible = isEligible(v);
                                    const isSelected = selectedVoucherId === v.id;

                                    return (
                                        <button
                                            key={v.id}
                                            disabled={!eligible}
                                            onClick={() => onSelect(v)}
                                            className={`w-full text-left p-5 rounded-[2rem] border transition-all relative flex items-center gap-4 group
                                                ${isSelected ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/10' : 'bg-white border-gray-100 hover:border-amber-200'}
                                                ${!eligible ? 'opacity-60 grayscale' : 'active:scale-[0.98]'}
                                            `}
                                        >
                                            <div className={`p-3 rounded-2xl shrink-0 transition-colors ${isSelected ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500'}`}>
                                                <Ticket className="w-6 h-6" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-black text-gray-800 tracking-tight">{v.code}</span>
                                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                                                </div>
                                                <p className="text-xs text-gray-500 font-bold mt-0.5">
                                                    Giảm {v.discountType === 'FIXED' ? `${v.discountValue.toLocaleString()}đ` : `${v.discountValue}%`}
                                                </p>
                                                {!eligible && !v.isReachedCustomerLimit && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] font-black text-red-400 uppercase tracking-tighter">
                                                        <Info className="w-3 h-3" />
                                                        Cần thêm {(v.minOrderValue - currentTotal).toLocaleString()}đ để áp dụng
                                                    </div>
                                                )}
                                                {v.isReachedCustomerLimit && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] font-black text-red-500 uppercase tracking-tighter">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Bạn đã dùng hết lượt cho ưu đãi này
                                                    </div>
                                                )}
                                                {eligible && v.description && (
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 line-clamp-1">{v.description}</p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-8 bg-white border-t border-gray-50">
                            <p className="text-[11px] text-center text-gray-400 font-medium mb-4 italic">
                                * Một số voucher có điều kiện đi kèm như khách hàng mới hoặc số lần đặt món.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                            >
                                ĐÓNG
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
