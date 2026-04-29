'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/axios';
import { ChefHat, Clock, CheckCircle2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
    id: string;
    quantity: number;
    notes: string;
    menuItem: {
        name: string;
        imageUrl: string | null;
    }
}

interface Order {
    id: string;
    table: {
        name: string;
    };
    items: OrderItem[];
    createdAt: string;
    status: string;
}

export default function KitchenModule() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchKitchenOrders = async () => {
        try {
            const res = await api.get('/orders?status=PENDING');
            setOrders(res.data);
        } catch (err) {
            console.error('Lỗi lấy đơn hàng bếp:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKitchenOrders();
        const interval = setInterval(fetchKitchenOrders, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleCompleteOrder = async (orderId: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: 'COMPLETED' });
            fetchKitchenOrders();
        } catch (err) {
            alert('Lỗi khi cập nhật trạng thái đơn hàng');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ChefHat className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                            Khu vực Nhà Bếp & Chế biến
                        </h2>
                        <p className="text-sm text-gray-500 font-medium italic italic">Điều phối và thực hiện các đơn hàng từ khách hàng</p>
                    </div>
                </div>
                <div className="px-5 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Hệ thống sẵn sàng</span>
                </div>
            </div>

            <div className="flex-1 p-8 bg-white overflow-y-auto">
                {orders.length === 0 ? (
                    <div className="col-span-full py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                        <ChefHat className="w-16 h-16 opacity-10 mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">Phòng bếp trống - Không có yêu cầu chế biến</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col"
                            >
                                <div className="p-6 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-orange-600 shadow-sm">
                                            {order.table.name}
                                        </div>
                                        <span className="font-black text-orange-800">BÀN {order.table.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs uppercase tracking-tighter">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 space-y-5">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                                {item.menuItem.imageUrl && (
                                                    <img src={item.menuItem.imageUrl} className="w-full h-full object-cover" alt="" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-black">{item.quantity}</span>
                                                    <span className="font-bold text-gray-800">{item.menuItem.name}</span>
                                                </div>
                                                {item.notes && (
                                                    <div className="mt-1 flex items-start gap-1 text-red-500 font-bold text-[10px] uppercase italic">
                                                        <Flame className="w-3 h-3 shrink-0" />
                                                        <span>Lưu ý: {item.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 pt-0">
                                    <button
                                        onClick={() => handleCompleteOrder(order.id)}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-900/10"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        Hoàn thành món
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
