'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '@/services/axios';
import { reservationService, Reservation } from '@/services/reservation.service';
import { tableService, Table } from '@/services/table.service';
import { Calendar, Users, Phone, Clock, Check, X, AlertCircle, Search, Filter, LayoutGrid, Edit, Save, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTable } from '@/hooks/useTable';

export default function ReservationModule() {
    const { data: reservations, mutate, isLoading } = useSWR<Reservation[]>(
        ['reservations'],
        () => reservationService.getReservations()
    );

    const { tables } = useTable();
    const [selectedTableForReservation, setSelectedTableForReservation] = useState<{ resId: string, tableId: string } | null>(null);
    const [editingRes, setEditingRes] = useState<Partial<Reservation> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newData, setNewData] = useState({
        customerName: '',
        customerPhone: '',
        guests: 2,
        reservationTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().substring(0, 16),
        note: '',
        tableId: ''
    });

    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');

    const handleCreateReservation = async () => {
        try {
            await api.post('/reservations', newData);
            mutate();
            setIsCreating(false);
            setNewData({
                customerName: '',
                customerPhone: '',
                guests: 2,
                reservationTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().substring(0, 16),
                note: '',
                tableId: ''
            });
        } catch (error) {
            alert('Lỗi khi tạo đặt bàn');
        }
    };

    const handleUpdateStatus = async (id: string, status: string, tableId?: string) => {
        try {
            await reservationService.updateStatus(id, status, tableId);
            mutate();
            setSelectedTableForReservation(null);
            setEditingRes(null);
        } catch (error) {
            console.error('Lỗi cập nhật:', error);
            alert('Không thể cập nhật trạng thái');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingRes || !editingRes.id) return;
        try {
            await reservationService.updateStatus(editingRes.id, editingRes.status!, editingRes.tableId!, {
                customerName: editingRes.customerName,
                customerPhone: editingRes.customerPhone,
                guests: editingRes.guests,
                reservationTime: editingRes.reservationTime,
                note: editingRes.note
            });
            mutate();
            setEditingRes(null);
        } catch (error) {
            alert('Lỗi khi lưu chỉnh sửa');
        }
    };

    const filteredData = reservations?.filter(r => {
        if (filter === 'ALL') return true;
        return r.status === filter;
    }) || [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                            Quản lý Đặt bàn & Lịch hẹn
                        </h2>
                        <p className="text-sm text-gray-500 font-medium italic">Theo dõi, xác nhận và điều phối chỗ ngồi cho khách hàng</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 mr-2">
                        {(['ALL', 'PENDING', 'CONFIRMED'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ duyệt' : 'Đã xác nhận'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        disabled={isCreating}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Đặt Bàn
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 bg-white overflow-y-auto">

                {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {/* THẺ TẠO MỚI */}
                            {isCreating && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="bg-white rounded-[2.5rem] border-2 border-dashed border-indigo-200 p-6 shadow-xl shadow-indigo-50/50 flex flex-col gap-4 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">Đang tạo mới</span>
                                        <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <input
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                            placeholder="Tên khách hàng"
                                            value={newData.customerName}
                                            onChange={(e) => setNewData({ ...newData, customerName: e.target.value })}
                                        />
                                        <input
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500"
                                            placeholder="Số điện thoại"
                                            value={newData.customerPhone}
                                            onChange={(e) => setNewData({ ...newData, customerPhone: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="w-20 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                                                value={newData.guests}
                                                onChange={(e) => setNewData({ ...newData, guests: Number(e.target.value) })}
                                            />
                                            <input
                                                type="datetime-local"
                                                className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                                value={newData.reservationTime}
                                                onChange={(e) => setNewData({ ...newData, reservationTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                            <select
                                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                                                value={newData.tableId}
                                                onChange={(e) => setNewData({ ...newData, tableId: e.target.value })}
                                            >
                                                <option value="">-- Chọn bàn gán ngay (Tùy chọn) --</option>
                                                {tables?.filter(t => t.status === 'AVAILABLE').map(t => (
                                                    <option key={t.id} value={t.id}>Bàn {t.name} (Sức chứa: {t.capacity})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <textarea
                                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                                            placeholder="Ghi chú thêm..."
                                            rows={2}
                                            value={newData.note}
                                            onChange={(e) => setNewData({ ...newData, note: e.target.value })}
                                        />
                                        <button
                                            onClick={handleCreateReservation}
                                            disabled={!newData.customerName || !newData.customerPhone}
                                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:bg-gray-300 transition-all active:scale-95"
                                        >
                                            <Save className="w-4 h-4" /> LƯU ĐẶT BÀN
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {filteredData.map((res) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={res.id}
                                    className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                                >
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${getStatusColor(res.status)}`}>
                                                {res.status === 'PENDING' ? 'Chờ xác nhận' : res.status === 'CONFIRMED' ? 'Đã xác nhận' : res.status}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingRes(res)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <div className="text-[10px] font-bold text-gray-400 italic">
                                                    {new Date(res.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>

                                        {editingRes?.id === res.id ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                                    placeholder="Tên khách hàng"
                                                    value={editingRes.customerName}
                                                    onChange={(e) => setEditingRes({ ...editingRes, customerName: e.target.value })}
                                                />
                                                <input
                                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500"
                                                    placeholder="Số điện thoại"
                                                    value={editingRes.customerPhone}
                                                    onChange={(e) => setEditingRes({ ...editingRes, customerPhone: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-20 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                                                        value={editingRes.guests}
                                                        onChange={(e) => setEditingRes({ ...editingRes, guests: Number(e.target.value) })}
                                                    />
                                                    <input
                                                        type="datetime-local"
                                                        className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                                        value={editingRes.reservationTime ? new Date(editingRes.reservationTime).toISOString().substring(0, 16) : ''}
                                                        onChange={(e) => setEditingRes({ ...editingRes, reservationTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                                    <select
                                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                                                        value={editingRes.tableId || ''}
                                                        onChange={(e) => setEditingRes({ ...editingRes, tableId: e.target.value })}
                                                    >
                                                        <option value="">-- Chưa gán bàn --</option>
                                                        {tables?.filter(t => t.status === 'AVAILABLE' || t.id === res.tableId).map(t => (
                                                            <option key={t.id} value={t.id}>Bàn {t.name} (Sức chứa: {t.capacity})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" /> LƯU THAY ĐỔI
                                                </button>
                                                <button
                                                    onClick={() => setEditingRes(null)}
                                                    className="w-full bg-white text-gray-400 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100"
                                                >
                                                    HỦY
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors uppercase">{res.customerName}</h3>

                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                                        {new Date(res.reservationTime).toLocaleString('vi-VN')}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                                        <Phone className="w-4 h-4 text-emerald-500" />
                                                        {res.customerPhone}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                                        <Users className="w-4 h-4 text-amber-500" />
                                                        {res.guests} người
                                                    </div>
                                                    {res.table && (
                                                        <div className="flex items-center gap-3 text-sm font-black text-indigo-600 bg-indigo-50 p-3 rounded-2xl border border-indigo-100 animate-pulse">
                                                            <LayoutGrid className="w-4 h-4" />
                                                            Đã gán: Bàn {res.table.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {res.note && !editingRes && (
                                            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs font-medium text-amber-800 italic">
                                                "{res.note}"
                                            </div>
                                        )}
                                    </div>

                                    {res.status === 'PENDING' && (
                                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 mt-auto">
                                            <button
                                                onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')}
                                                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                                            >
                                                <Check className="w-4 h-4" /> Xác nhận
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                                                className="flex-1 bg-white text-red-600 border-2 border-red-50 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" /> Hủy bỏ
                                            </button>
                                        </div>
                                    )}

                                    {res.status === 'CONFIRMED' && (
                                        <div className="p-6 bg-emerald-50 border-t border-emerald-100 mt-auto flex flex-col gap-3">
                                            <button
                                                onClick={() => handleUpdateStatus(res.id, 'ARRIVED')}
                                                className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                            >
                                                <Users className="w-4 h-4" /> Khách đã đến
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                                                className="w-full bg-white text-gray-400 border border-emerald-100 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                                Hủy lịch
                                            </button>
                                        </div>
                                    )}

                                    {res.status === 'ARRIVED' && (
                                        <div className="p-6 bg-blue-50 border-t border-blue-100 mt-auto">
                                            <button
                                                onClick={() => handleUpdateStatus(res.id, 'COMPLETED')}
                                                className="w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & Trả bàn
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredData.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-300">
                                <AlertCircle className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest">Không tìm thấy yêu cầu nào</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
