'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, RotateCcw, User, Flame } from 'lucide-react';
import { Table } from '@/services/table.service';

interface TableMapProps {
    tables: Table[];
    selectedTableId: string | null;
    onSelectTable: (id: string) => void;
    onRefresh: () => void;
    tableHasNewOrder: (id: string) => boolean;
    isLoading: boolean;
}

export default function TableMap({
    tables,
    selectedTableId,
    onSelectTable,
    onRefresh,
    tableHasNewOrder,
    isLoading
}: TableMapProps) {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col">
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
                        return (
                            <motion.button
                                key={table.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectTable(table.id)}
                                className={`
                                    relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2
                                    ${selectedTableId === table.id ? 'border-gray-900 ring-4 ring-gray-900/5' : 'border-transparent'}
                                    ${hasNew
                                        ? 'bg-red-100 border-red-500 text-red-700 animate-pulse'
                                        : table.status === 'AVAILABLE'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-orange-50 text-orange-700'
                                    }
                                `}
                            >
                                <span className="text-xs font-black uppercase opacity-60">BÀN</span>
                                <span className="text-3xl font-black">{table.name}</span>
                                {hasNew && <Flame className="w-4 h-4 text-red-500 absolute top-2 left-2" />}
                                <div className="flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">{table.capacity}</span>
                                </div>
                                {table.status === 'OCCUPIED' && !hasNew && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="mt-auto pt-6 flex items-center gap-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <div className="w-3 h-3 bg-green-500 rounded-full" /> Trống
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" /> Đang ăn
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /> Đợi duyệt
                </div>
            </div>
        </div>
    );
}
