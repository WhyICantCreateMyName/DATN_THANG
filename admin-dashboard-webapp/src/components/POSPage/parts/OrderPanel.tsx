'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, AlertCircle, Clock, CheckCircle2, XCircle, Ticket } from 'lucide-react';
import { Order } from '@/services/order.service';

interface OrderPanelProps {
    table: { name: string; status: string } | undefined;
    orders: Order[];
    isLoading: boolean;
    onApprove: (id: string) => void;
    onCancel: (id: string) => void;
    onUpdateStatus: (id: string, status: string) => void;
    selectedOrderIds: string[];
    onToggleSelect: (id: string) => void;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'WAITING_APPROVAL': return { label: 'Chờ duyệt', color: 'bg-red-500 text-white' };
        case 'PENDING': return { label: 'Chờ chế biến', color: 'bg-orange-500 text-white' };
        case 'COOKING': return { label: 'Đang nấu', color: 'bg-amber-500 text-white' };
        case 'READY': return { label: 'Sẵn sàng trả', color: 'bg-green-500 text-white' };
        case 'SERVED': return { label: 'Đã phục vụ', color: 'bg-blue-500 text-white' };
        default: return { label: status, color: 'bg-gray-500 text-white' };
    }
};

export default function OrderPanel({ 
    table, 
    orders, 
    isLoading, 
    onApprove, 
    onCancel,
    onUpdateStatus,
    selectedOrderIds,
    onToggleSelect
}: OrderPanelProps) {
    if (!table) return null;

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-widest mb-1">
                        <ClipboardList className="w-4 h-4" />
                        Chi tiết đơn hàng
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">BÀN {table.name}</h3>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm
                        ${table.status === 'AVAILABLE' ? 'bg-green-500 text-white' : 
                          table.status === 'RESERVED' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'}
                    `}>
                        {table.status === 'AVAILABLE' ? 'Trống' : 
                         table.status === 'RESERVED' ? 'Đã đặt bàn' : 'Đang phục vụ'}
                    </span>
                </div>
            </div>

            {/* Order List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                        <AlertCircle className="w-16 h-16 opacity-20 mb-4" />
                        <p className="font-bold">Chưa có đơn hàng nào</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {orders.map((order) => {
                            const isSelected = selectedOrderIds.includes(order.id);
                            const badge = getStatusBadge(order.status);
                            return (
                                <motion.div 
                                    key={order.id} 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-6 rounded-[2rem] border-2 shadow-sm transition-all relative ${
                                        order.status === 'WAITING_APPROVAL' 
                                            ? 'border-red-200 bg-red-50/30' 
                                            : isSelected 
                                                ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20' 
                                                : 'border-gray-50 bg-white hover:border-gray-200'
                                    }`}
                                >
                                    {/* Selection Checkbox */}
                                    <div 
                                        onClick={() => onToggleSelect(order.id)}
                                        className={`absolute -left-3 -top-3 w-8 h-8 rounded-full border-4 border-gray-50 flex items-center justify-center cursor-pointer transition-all z-10
                                            ${isSelected ? 'bg-amber-500 text-white scale-110 shadow-lg' : 'bg-white text-gray-200 hover:text-gray-400'}
                                        `}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>

                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-gray-400 uppercase">#{order.id.slice(-4).toUpperCase()}</span>
                                        <span className={`px-3 py-1 ${badge.color} text-[10px] font-black uppercase rounded-lg shadow-sm animate-in fade-in zoom-in duration-300`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-xs uppercase tracking-tighter">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-900 border border-gray-200">
                                                    {item.quantity}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{item.menuItem.name}</p>
                                                    {item.notes && (
                                                        <div className="mt-1 px-2 py-1 bg-yellow-50 border-l-2 border-yellow-400 rounded-r-md">
                                                            <p className="text-xs text-yellow-700 font-bold italic">Ghi chú: {item.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="font-black text-gray-900 text-sm">{(item.priceAtTime * item.quantity).toLocaleString()}đ</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Voucher Info */}
                                {order.voucherCode && (
                                    <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-dashed border-amber-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
                                                <Ticket className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-800 tracking-wider">VOUCHER: {order.voucherCode}</p>
                                                <p className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">Đã áp dụng ưu đãi</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-amber-600">-{order.discountAmount?.toLocaleString()}đ</span>
                                    </div>
                                )}

                                {/* Status Controls */}
                                <div className="mt-6 pt-6 border-t border-gray-50 flex gap-2">
                                    {order.status === 'WAITING_APPROVAL' ? (
                                        <>
                                            <button 
                                                onClick={() => onApprove(order.id)}
                                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                                Duyệt đơn
                                            </button>
                                            <button 
                                                onClick={() => onCancel(order.id)}
                                                className="p-3 bg-white border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                                            >
                                                <XCircle className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </>
                                    ) : order.status === 'PENDING' ? (
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, 'COOKING')}
                                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg"
                                        >
                                            Bắt đầu chế biến
                                        </button>
                                    ) : order.status === 'COOKING' ? (
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, 'READY')}
                                            className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg"
                                        >
                                            Đã xong món
                                        </button>
                                    ) : order.status === 'READY' ? (
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, 'SERVED')}
                                            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg"
                                        >
                                            Trả món cho khách
                                        </button>
                                    ) : null}
                                </div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
