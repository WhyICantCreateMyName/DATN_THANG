'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Ticket, CheckCircle2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VoucherRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VoucherRegistrationModal({ isOpen, onClose }: VoucherRegistrationModalProps) {
    const { customer, login, logout } = useAuth();
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return alert('Vui lòng nhập số điện thoại');
        
        setIsSubmitting(true);
        try {
            await login(phone, name);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Lỗi khi đăng nhập');
        } finally {
            setIsSubmitting(false);
        }
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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden border border-white/20"
                    >
                        {isSuccess ? (
                            <div className="p-10 text-center flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">Chào mừng trở lại!</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Đăng nhập thành công. Bạn đã có thể chọn voucher trong giỏ hàng.</p>
                                </div>
                            </div>
                        ) : customer ? (
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-800">Tài khoản của bạn</h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{customer.phone}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={onClose} className="p-2 bg-gray-50 text-gray-400 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <p className="text-sm text-gray-600 font-medium">Họ tên: <span className="font-bold text-gray-800">{customer.name || 'N/A'}</span></p>
                                    <p className="text-[11px] text-gray-400 mt-2 italic">Bạn đã đăng nhập thành công. Hãy chọn voucher phù hợp nhất trong giỏ hàng để nhận ưu đãi.</p>
                                </div>

                                <button 
                                    onClick={() => { logout(); onClose(); }}
                                    className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    ĐĂNG XUẤT
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                            <Ticket className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-800">Nhận Voucher</h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Đăng nhập bằng SĐT</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={onClose} className="p-2 bg-gray-50 text-gray-400 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Số điện thoại</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                required
                                                type="tel"
                                                placeholder="VD: 0987654321"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-bold text-gray-800"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Họ tên (Để nhận ưu đãi)</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                required
                                                placeholder="Nhập tên của bạn..."
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-bold text-gray-800"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'ĐANG XỬ LÝ...' : 'TIẾP TỤC'}
                                </button>
                                
                                <p className="text-[10px] text-center text-gray-400 font-medium px-4">
                                    Hệ thống sẽ tự động đăng ký nếu bạn là khách hàng mới.
                                </p>
                            </form>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
