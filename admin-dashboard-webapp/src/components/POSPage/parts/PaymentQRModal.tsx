'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CreditCard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentQRModalProps {
    url: string;
    onClose: () => void;
    tableName?: string;
    isSuccess?: boolean;
    method?: 'VNPAY' | 'MOMO';
}

export default function PaymentQRModal({ url, onClose, tableName, isSuccess, method = 'VNPAY' }: PaymentQRModalProps) {
    const isMomo = method === 'MOMO';
    
    // Theme config based on method
    const themes = {
        VNPAY: {
            bg: 'bg-gradient-to-r from-blue-600 to-indigo-700',
            accent: 'text-blue-600',
            qrColor: '#1e3a8a',
            label: 'VNPay QR',
            desc: 'Sử dụng ứng dụng Ngân hàng hoặc Ví VNPAY để quét mã.'
        },
        MOMO: {
            bg: 'bg-gradient-to-r from-pink-500 to-rose-600',
            accent: 'text-pink-600',
            qrColor: '#ae2070',
            label: 'MoMo QR',
            desc: 'Sử dụng ứng dụng Ví MoMo để quét mã thanh toán.'
        }
    };

    const currentTheme = themes[method];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Header */}
                    <div className={`p-8 text-white relative transition-colors duration-500 ${isSuccess ? 'bg-green-500' : currentTheme.bg}`}>
                        {!isSuccess && (
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                {isSuccess ? (
                                    <ShieldCheck className="w-6 h-6 text-green-500" />
                                ) : (
                                    <CreditCard className={`w-6 h-6 ${currentTheme.accent}`} />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">
                                    {isSuccess ? 'Thành công!' : `Thanh toán ${currentTheme.label}`}
                                </h3>
                                <p className="text-white/80 text-sm font-medium">Bàn {tableName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-10 flex flex-col items-center min-h-[400px] justify-center text-center">
                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.div
                                    key="qr"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border border-gray-100 mb-8">
                                        <QRCodeSVG
                                            value={url}
                                            size={240}
                                            level="M"
                                            includeMargin={false}
                                            className="rounded-lg"
                                            fgColor={currentTheme.qrColor}
                                        />
                                    </div>
                                    <div className="text-center space-y-4">
                                        <p className="text-gray-900 font-bold text-lg leading-tight">Quét mã để thanh toán</p>
                                        <p className="text-gray-500 text-sm max-w-[240px] mx-auto font-medium">
                                            {currentTheme.desc}
                                        </p>
                                    </div>
                                    <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                        <ShieldCheck className="w-4 h-4" />
                                        Giao dịch an toàn & Bảo mật
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mb-8">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring' }}
                                        >
                                            <ShieldCheck className="w-16 h-16 text-green-500" />
                                        </motion.div>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Tuyệt vời!</h2>
                                    <p className="text-gray-500 font-medium max-w-[280px] leading-relaxed">
                                        Hệ thống đã nhận được tiền.<br />
                                        Đơn hàng của bàn <strong>{tableName}</strong> đã được tất toán thành công.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Info */}
                    {!isSuccess && (
                        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                Hệ thống sẽ tự động cập nhật<br />ngay khi giao dịch hoàn tất
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
