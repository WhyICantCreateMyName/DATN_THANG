'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CreditCard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VNPAYQRModalProps {
    url: string;
    onClose: () => void;
    tableName?: string;
}

export default function VNPAYQRModal({ url, onClose, tableName }: VNPAYQRModalProps) {
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
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Thanh toán VNPay</h3>
                                <p className="text-blue-100 text-sm font-medium">Bàn {tableName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Content */}
                    <div className="p-10 flex flex-col items-center">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border border-gray-100 mb-8">
                            <QRCodeSVG
                                value={url}
                                size={240}
                                level="M" // Giảm mức sửa lỗi để mã QR thưa hơn
                                includeMargin={false}
                                className="rounded-lg"
                                fgColor="#1e3a8a" // Màu xanh đậm cho sang trọng
                            />
                        </div>

                        <div className="text-center space-y-4">
                            <p className="text-gray-900 font-bold text-lg leading-tight">
                                Quét mã để thanh toán
                            </p>
                            <p className="text-gray-500 text-sm max-w-[240px] mx-auto font-medium">
                                Sử dụng ứng dụng Ngân hàng hoặc Ví VNPAY để quét mã QR phía trên.
                            </p>
                        </div>

                        {/* Security Badge */}
                        <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            Giao dịch an toàn & Bảo mật
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                            Hệ thống sẽ tự động cập nhật<br />ngay khi giao dịch hoàn tất
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
