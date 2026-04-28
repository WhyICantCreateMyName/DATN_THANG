'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTable } from '@/hooks/useTable';
import { useOrders } from '@/hooks/useOrders';
import { useSocket } from '@/hooks/useSocket';
import { orderService } from '@/services/order.service';
import { tableService } from '@/services/table.service';

// Import các sub-components đã tách
import TableMap from './parts/TableMap';
import OrderPanel from './parts/OrderPanel';
import CheckoutPanel from './parts/CheckoutPanel';
import OrderActions from './parts/OrderActions';
import ChatPanel from './parts/ChatPanel';
import { LayoutGrid } from 'lucide-react';

export default function POSModule() {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const socket = useSocket();

    // 1. Lấy dữ liệu Sơ đồ bàn
    const {
        tables,
        isLoading: isTablesLoading,
        mutateTables,
        checkoutTable
    } = useTable();

    // 2. Lấy đơn hàng của bàn đang chọn (Lưu ý: onlyActive=true để sửa lỗi hiện đơn cũ)
    const {
        orders: activeOrders,
        isLoading: isOrdersLoading,
        approveOrder,
        cancelOrder,
        mutate: mutateActiveOrders
    } = useOrders(selectedTableId ? { tableId: selectedTableId, onlyActive: true } : undefined);

    // 3. Lấy tất cả đơn chờ duyệt để báo hiệu trên Map
    const { orders: waitingOrders, mutate: mutateWaitingOrders } = useOrders({ status: 'WAITING_APPROVAL' });

    // Xử lý hiệu ứng âm thanh lặp lại khi có đơn chờ duyệt
    useEffect(() => {
        if (!audioRef.current) return;

        if (waitingOrders.length > 0) {
            audioRef.current.loop = true;
            audioRef.current.play().catch(() => {
                console.log('🔇 Trình duyệt chặn tự động phát âm thanh. Vui lòng click vào trang ít nhất 1 lần.');
            });
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.loop = false;
        }
    }, [waitingOrders]);

    // Xử lý Socket Real-time
    useEffect(() => {
        if (socket) {
            socket.on('staff_notification', (data: any) => {
                if (data.type === 'NEW_ORDER' || data.type === 'TABLE_UPDATED' || data.type === 'CALL_STAFF') {
                    mutateTables();
                    mutateWaitingOrders();
                    if (selectedTableId) mutateActiveOrders();
                }
            });
        }
    }, [socket, selectedTableId, mutateTables, mutateWaitingOrders, mutateActiveOrders]);

    const selectedTable = tables?.find(t => t.id === selectedTableId);

    // --- CÁC HÀNH ĐỘNG NGHIỆP VỤ ---

    const handleApprove = async (id: string) => {
        await approveOrder(id);
        mutateTables();
        mutateWaitingOrders();
        mutateActiveOrders();
    };

    const handleCancel = async (id: string) => {
        await cancelOrder(id);
        mutateActiveOrders();
        mutateWaitingOrders();
    };

    const handleCheckout = async () => {
        if (!selectedTableId || !selectedTable) return;
        try {
            await checkoutTable(selectedTableId);
            setSelectedTableId(null);
            mutateWaitingOrders();
        } catch (err: any) {
            alert(err.message || 'Lỗi thanh toán');
        }
    };

    const handleMoveOrder = async (orderId: string, targetTableId: string) => {
        try {
            await orderService.moveOrder(orderId, targetTableId);
            mutateTables();
            mutateActiveOrders();
            mutateWaitingOrders();
        } catch (err: any) {
            alert(err.message || 'Lỗi khi chuyển đơn');
        }
    };

    const handleMergeTables = async (sourceId: string, targetId: string) => {
        try {
            await tableService.mergeTables(sourceId, targetId);
            mutateTables();
            if (sourceId === selectedTableId) setSelectedTableId(targetId);
            mutateActiveOrders();
            mutateWaitingOrders();
        } catch (err: any) {
            alert(err.message || 'Lỗi khi gộp bàn');
        }
    };

    const calculateTotal = () => activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const hasNewOrder = (id: string) => waitingOrders.some(o => o.tableId === id);

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto" />

            {/* PHẦN 1: SƠ ĐỒ BÀN (30% chiều rộng) */}
            <div className="w-[30%] min-w-[320px]">
                <TableMap
                    tables={tables || []}
                    selectedTableId={selectedTableId}
                    onSelectTable={setSelectedTableId}
                    onRefresh={() => { mutateTables(); mutateWaitingOrders(); }}
                    tableHasNewOrder={hasNewOrder}
                    isLoading={isTablesLoading}
                />
            </div>

            {/* PHẦN 2 & 3: CHI TIẾT ĐƠN HÀNG & CHAT (70% chiều rộng) */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
                {selectedTableId && selectedTable ? (
                    <div className="flex h-full overflow-hidden">
                        {/* Cột giữa: Đơn hàng */}
                        <div className="flex-1 flex flex-col border-r border-gray-100 min-w-[400px] relative">
                            {/* Action Bar Nâng cao */}
                            <div className="absolute top-6 right-8 z-20 flex gap-2">
                                {activeOrders.length > 0 && tables && (
                                    <OrderActions
                                        tables={tables}
                                        currentTableId={selectedTableId}
                                        orderId={activeOrders[0]?.id}
                                        onMove={(target) => handleMoveOrder(activeOrders[0]?.id, target)}
                                        onMerge={handleMergeTables}
                                    />
                                )}
                            </div>

                            <OrderPanel
                                table={selectedTable}
                                orders={activeOrders}
                                isLoading={isOrdersLoading}
                                onApprove={handleApprove}
                                onCancel={handleCancel}
                            />

                            <CheckoutPanel
                                total={calculateTotal()}
                                canCheckout={activeOrders.length > 0}
                                onCheckout={handleCheckout}
                            />
                        </div>

                        {/* Cột phải: Chat với khách */}
                        <div className="w-[350px] flex-shrink-0">
                            <ChatPanel tableId={selectedTableId} socket={socket} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-20 text-center">
                        <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-6">
                            <LayoutGrid className="w-12 h-12 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hệ thống POS</h3>
                        <p className="font-medium text-sm leading-relaxed max-w-xs">Chọn bàn để xử lý đơn hàng, trò chuyện với khách hoặc thanh toán hóa đơn.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
