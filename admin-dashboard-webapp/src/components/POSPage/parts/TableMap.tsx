'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, RotateCcw, User, Flame, MessageCircle, Calendar, X, Plus, CheckCircle2 } from 'lucide-react';
import { Table } from '@/services/table.service';

interface TableMapProps {
    tables: Table[];
    reservations?: any[];
    selectedTableId: string | null;
    onSelectTable: (id: string) => void;
    onRefresh: () => void;
    tableHasNewOrder: (id: string) => boolean;
    unreadTables?: string[];
    isLoading: boolean;
}

export default function TableMap({
    tables,
    reservations = [],
    selectedTableId,
    onSelectTable,
    onRefresh,
    tableHasNewOrder,
    unreadTables = [],
    isLoading
}: TableMapProps) {
    const [selectedTableForRes, setSelectedTableForRes] = React.useState<Table | null>(null);

    const getTableStyle = (table: Table, hasNew: boolean, hasRes: boolean) => {
        if (hasNew) return 'bg-red-100 border-red-500 text-red-700 animate-pulse';

        switch (table.status) {
            case 'AVAILABLE':
                return hasRes ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-green-50 border-green-100 text-green-700';
            case 'RESERVED':
                return 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner';
            case 'OCCUPIED':
                return 'bg-orange-50 border-orange-200 text-orange-700';
            default:
                return 'bg-gray-50 border-gray-100 text-gray-500';
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-900 rounded-2xl text-white">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Sơ đồ nhà hàng</h2>
                </div>
                <button onClick={onRefresh} className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                    <RotateCcw className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {tables?.map((table) => {
                        const hasNew = tableHasNewOrder(table.id);
                        const hasUnread = unreadTables.includes(table.id);
                        // Chỉ lấy các đơn đã xác nhận hoặc đã đến của bàn này
                        const tableReservations = reservations.filter(r => r.tableId === table.id && ['CONFIRMED', 'ARRIVED'].includes(r.status));
                        const hasReservation = tableReservations.length > 0;

                        return (
                            <motion.div
                                key={table.id}
                                className="relative group"
                                whileHover={{ scale: 1.02 }}
                            >
                                <button
                                    onClick={() => onSelectTable(table.id)}
                                    className={`
                                        w-full p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2
                                        ${selectedTableId === table.id ? 'border-gray-900 ring-4 ring-gray-900/5' : 'border-transparent'}
                                        ${getTableStyle(table, hasNew, hasReservation)}
                                    `}
                                >
                                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">BÀN</span>
                                    <span className="text-3xl font-black">{table.name}</span>

                                    <div className="flex items-center gap-1 mt-1">
                                        <User className="w-3 h-3" />
                                        <span className="text-[10px] font-bold">{table.capacity} Ghế</span>
                                    </div>
                                </button>

                                {/* Badge & Icons */}
                                {hasNew && <Flame className="w-4 h-4 text-red-500 absolute top-3 left-3" />}

                                {hasReservation && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedTableForRes(table); }}
                                        className="absolute top-2 left-2 p-1.5 bg-white rounded-lg shadow-sm border border-indigo-100 text-indigo-500 hover:scale-110 transition-transform"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {hasUnread && (
                                    <div className="absolute top-2 left-2 flex h-4 w-4">
                                        <MessageCircle className="w-4 h-4 text-blue-500 animate-bounce" />
                                    </div>
                                )}

                                {(table.status === 'OCCUPIED' || table.status === 'RESERVED') && !hasNew && (
                                    <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full shadow-sm ${table.status === 'RESERVED' ? 'bg-indigo-500' : 'bg-orange-500'}`} />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="mt-auto pt-6 flex flex-wrap items-center gap-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-gray-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full" /> Trống
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-gray-400">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full" /> Đã đặt
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-gray-400">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" /> Phục vụ
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-gray-400">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /> Đợi duyệt
                </div>
            </div>

            {/* MODAL XEM LỊCH ĐẶT */}
            {selectedTableForRes && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase">Lịch đặt: Bàn {selectedTableForRes.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold">Danh sách các yêu cầu đặt trước</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTableForRes(null)} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                {reservations.filter(r => r.tableId === selectedTableForRes.id && ['CONFIRMED', 'ARRIVED'].includes(r.status)).length === 0 ? (
                                    <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        Chưa có lịch đặt nào
                                    </div>
                                ) : (
                                    reservations.filter(r => r.tableId === selectedTableForRes.id && ['CONFIRMED', 'ARRIVED'].includes(r.status))
                                        .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime())
                                        .map(res => (
                                            <div key={res.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-indigo-50/50 transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-gray-900 uppercase">{res.customerName}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${res.status === 'ARRIVED' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            {res.status === 'ARRIVED' ? 'Đã đến' : 'Đã xác nhận'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(res.reservationTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            {" - "}
                                                            {new Date(res.reservationTime).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {res.guests} người
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 border-t border-gray-100">
                            <button onClick={() => setSelectedTableForRes(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
