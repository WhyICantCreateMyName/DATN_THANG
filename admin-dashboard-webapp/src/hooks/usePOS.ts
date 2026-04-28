import { useState, useEffect, useRef, useMemo } from 'react';
import { useTable } from '@/hooks/useTable';
import { useOrders } from '@/hooks/useOrders';
import { useSocket } from '@/hooks/useSocket';
import { orderService } from '@/services/order.service';
import { tableService } from '@/services/table.service';

export const usePOS = () => {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [unreadTables, setUnreadTables] = useState<string[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const socket = useSocket();

    // 1. Dữ liệu Bàn
    const { tables, isLoading: isTablesLoading, mutateTables, checkoutTable } = useTable();

    // 2. Đơn hàng của bàn đang chọn
    const { 
        orders: activeOrders, 
        isLoading: isOrdersLoading, 
        approveOrder, 
        cancelOrder, 
        mutate: mutateActiveOrders 
    } = useOrders(selectedTableId ? { tableId: selectedTableId, onlyActive: true } : undefined);

    // 3. Đơn hàng chờ duyệt
    const { orders: waitingOrders, mutate: mutateWaitingOrders } = useOrders({ status: 'WAITING_APPROVAL' });

    const selectedTable = useMemo(() => tables?.find(t => t.id === selectedTableId), [tables, selectedTableId]);

    // 4. Âm thanh thông báo
    useEffect(() => {
        if (!audioRef.current) return;
        if (waitingOrders.length > 0) {
            audioRef.current.loop = true;
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [waitingOrders]);

    // 5. Socket Logic
    useEffect(() => {
        if (!socket) return;

        socket.on('staff_notification', (data: any) => {
            if (notificationAudioRef.current) {
                notificationAudioRef.current.play().catch(() => {});
            }

            if (data.type === 'NEW_MESSAGE' && data.tableId !== selectedTableId) {
                setUnreadTables(prev => Array.from(new Set([...prev, data.tableId])));
            }

            mutateTables();
            mutateWaitingOrders();
            if (selectedTableId) mutateActiveOrders();
        });

        return () => { socket.off('staff_notification'); };
    }, [socket, selectedTableId, mutateTables, mutateWaitingOrders, mutateActiveOrders]);

    // 6. Hành động
    const handleApprove = async (id: string) => {
        await approveOrder(id);
        mutateTables(); mutateWaitingOrders(); mutateActiveOrders();
    };

    const handleCancel = async (id: string) => {
        await cancelOrder(id);
        mutateActiveOrders(); mutateWaitingOrders();
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        await orderService.updateStatus(id, status);
        mutateActiveOrders(); mutateWaitingOrders(); mutateTables();
    };

    const handleCheckout = async () => {
        if (!selectedTableId || !selectedTable) return;
        const ids = selectedOrderIds.length > 0 ? selectedOrderIds : undefined;
        await checkoutTable(selectedTableId, ids);
        setSelectedOrderIds([]);
        mutateTables(); mutateWaitingOrders(); mutateActiveOrders();
    };

    const handleMoveOrder = async (orderId: string, targetTableId: string) => {
        await orderService.moveOrder(orderId, targetTableId);
        mutateTables(); mutateActiveOrders(); mutateWaitingOrders();
    };

    const handleMergeTables = async (sourceId: string, targetId: string) => {
        await tableService.mergeTables(sourceId, targetId);
        mutateTables();
        if (sourceId === selectedTableId) setSelectedTableId(targetId);
        mutateActiveOrders(); mutateWaitingOrders();
    };

    const calculateTotal = () => {
        const orders = selectedOrderIds.length > 0 
            ? activeOrders.filter(o => selectedOrderIds.includes(o.id))
            : activeOrders;
        return orders.reduce((sum, o) => sum + o.totalAmount, 0);
    };

    const toggleOrderSelection = (id: string) => {
        setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]);
    };

    return {
        selectedTableId, setSelectedTableId,
        unreadTables, setUnreadTables,
        selectedOrderIds, toggleOrderSelection,
        tables, isTablesLoading,
        activeOrders, isOrdersLoading,
        waitingOrders,
        selectedTable,
        audioRef, notificationAudioRef,
        socket,
        handleApprove, handleCancel, handleUpdateStatus, handleCheckout, handleMoveOrder, handleMergeTables,
        calculateTotal,
        mutateTables, mutateWaitingOrders
    };
};
