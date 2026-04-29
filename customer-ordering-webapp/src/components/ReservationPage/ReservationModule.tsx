'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, User, Phone, MessageSquare, ChevronLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/axios';

export default function ReservationModule() {
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        guests: 2,
        reservationTime: '',
        note: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/reservations', formData);
            setIsSuccess(true);
        } catch (error) {
            console.error('Lỗi đặt bàn:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-premium flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-md"
                >
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Đặt bàn thành công!</h2>
                    <p className="text-gray-500 font-medium mb-8">
                        Cảm ơn bạn {formData.customerName}. Nhà hàng đã nhận được yêu cầu đặt bàn cho {formData.guests} người vào lúc {new Date(formData.reservationTime).toLocaleString('vi-VN')}. Nhân viên sẽ sớm liên hệ xác nhận với bạn qua SĐT {formData.customerPhone}.
                    </p>
                    <Link 
                        href="/"
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl"
                    >
                        VỀ TRANG CHỦ
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium pb-20">
            <div className="p-6 flex items-center gap-4">
                <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm text-gray-400">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Đặt bàn trực tuyến</h1>
            </div>

            <div className="px-6 max-w-md mx-auto">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass p-8 rounded-[2.5rem] shadow-xl border-white/40"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <User className="w-3 h-3" /> Họ và tên
                            </label>
                            <input 
                                required
                                type="text"
                                placeholder="Nhập tên của bạn"
                                className="w-full px-5 py-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-gray-800"
                                value={formData.customerName}
                                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <Phone className="w-3 h-3" /> Số điện thoại
                            </label>
                            <input 
                                required
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                className="w-full px-5 py-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-gray-800"
                                value={formData.customerPhone}
                                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <Users className="w-3 h-3" /> Số khách
                                </label>
                                <select 
                                    className="w-full px-5 py-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-gray-800 appearance-none"
                                    value={formData.guests}
                                    onChange={(e) => setFormData({...formData, guests: Number(e.target.value)})}
                                >
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                        <option key={n} value={n}>{n} người</option>
                                    ))}
                                    <option value="15">Đoàn đông (10+)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <Clock className="w-3 h-3" /> Thời gian
                                </label>
                                <input 
                                    required
                                    type="datetime-local"
                                    className="w-full px-5 py-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-sm"
                                    value={formData.reservationTime}
                                    onChange={(e) => setFormData({...formData, reservationTime: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <MessageSquare className="w-3 h-3" /> Ghi chú (nếu có)
                            </label>
                            <textarea 
                                rows={3}
                                placeholder="Ví dụ: Bàn gần cửa sổ, ít cay..."
                                className="w-full px-5 py-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-gray-800"
                                value={formData.note}
                                onChange={(e) => setFormData({...formData, note: e.target.value})}
                            />
                        </div>

                        <button 
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg active:scale-95 transition-all shadow-xl shadow-gray-900/20 disabled:bg-gray-400 mt-4"
                        >
                            {isSubmitting ? 'ĐANG GỬI...' : 'XÁC NHẬN ĐẶT BÀN'}
                        </button>
                    </form>
                </motion.div>
                
                <p className="mt-8 text-center text-xs text-gray-400 font-medium italic">
                    * Sau khi bạn gửi yêu cầu, chúng tôi sẽ gọi điện xác nhận trong vòng 15-30 phút.
                </p>
            </div>
        </div>
    );
}
