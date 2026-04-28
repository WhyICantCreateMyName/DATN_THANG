'use client';

import React, { useState } from 'react';
import { Share2, Merge, X, ArrowRightLeft } from 'lucide-react';
import { Table } from '@/services/table.service';

interface OrderActionsProps {
    tables: Table[];
    currentTableId: string;
    orderId: string;
    onMove: (targetTableId: string) => void;
    onMerge: (sourceTableId: string, targetTableId: string) => void;
}

export default function OrderActions({ tables, currentTableId, orderId, onMove, onMerge }: OrderActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<'MOVE' | 'MERGE' | null>(null);

    const otherTables = tables.filter(t => t.id !== currentTableId);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                title="Tác vụ nâng cao"
            >
                <ArrowRightLeft className="w-4 h-4 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                        <span className="font-black text-xs uppercase text-gray-900 leading-none">Chuyển / Gộp Đơn</span>
                        <button onClick={() => { setIsOpen(false); setActionType(null); }}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>

                    {!actionType ? (
                        <div className="space-y-2">
                            <button 
                                onClick={() => setActionType('MOVE')}
                                className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-colors group"
                            >
                                <Share2 className="w-4 h-4 text-orange-500" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-gray-800">Tách đơn / Chuyển bàn</p>
                                    <p className="text-[10px] text-gray-400">Chuyển đơn hàng sang bàn khác</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => setActionType('MERGE')}
                                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors group"
                            >
                                <Merge className="w-4 h-4 text-blue-500" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-gray-800">Gộp tất cả về bàn khác</p>
                                    <p className="text-[10px] text-gray-400">Gộp toàn bộ món sang bàn khác</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-3 px-1">
                                {actionType === 'MOVE' ? 'Chọn bàn đích:' : 'Gộp toàn bộ về bàn:'}
                            </p>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                {otherTables.map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => {
                                            if (actionType === 'MOVE') onMove(table.id);
                                            else onMerge(currentTableId, table.id);
                                            setIsOpen(false);
                                            setActionType(null);
                                        }}
                                        className="py-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl text-xs font-black transition-all"
                                    >
                                        {table.name}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setActionType(null)}
                                className="w-full mt-4 text-[10px] font-bold text-gray-400 hover:text-gray-600"
                            >
                                Quay lại
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
