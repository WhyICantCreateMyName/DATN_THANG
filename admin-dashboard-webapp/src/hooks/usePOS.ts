import { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import api from '@/services/axios';
import { useTable } from '@/hooks/useTable';
import { useOrders } from '@/hooks/useOrders';
import { useSocket } from '@/hooks/useSocket';
import { orderService } from '@/services/order.service';
import { tableService } from '@/services/table.service';
import { reservationService, Reservation } from '@/services/reservation.service';
import { useNotificationContext } from '@/contexts/NotificationContext';

export const usePOS = () => {
    const { waitingOrders, mutateWaitingOrders, unreadTableIds, markTableAsRead } = useNotificationContext();
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [vnpayUrl, setVnpayUrl] = useState<string | null>(null);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

    // Sử dụng unreadTableIds trực tiếp từ Context
    const unreadTables = unreadTableIds;

    const socket = useSocket();
    const { tables, isLoading: isTablesLoading, mutateTables, checkoutTable } = useTable();

    // 2. Đơn hàng của bàn đang chọn
    const {
        orders: activeOrders,
        isLoading: isOrdersLoading,
        approveOrder,
        cancelOrder,
        mutate: mutateActiveOrders
    } = useOrders(selectedTableId ? { tableId: selectedTableId, onlyActive: true } : undefined);

    // 4. Lịch hẹn đặt bàn
    const { data: reservations, mutate: mutateReservations } = useSWR(
        ['reservations'],
        () => reservationService.getReservations(),
        { refreshInterval: 30000 }
    );

    const activeReservations = useMemo(() =>
        (reservations?.data as Reservation[])?.filter((r: any) => ['PENDING', 'CONFIRMED', 'ARRIVED'].includes(r.status)) || [],
        [reservations]);

    const selectedTable = useMemo(() => tables?.find(t => t.id === selectedTableId), [tables, selectedTableId]);

    // 5. Socket Logic - CHỈ DÙNG ĐỂ FETCH LẠI DỮ LIỆU
    useEffect(() => {
        if (!socket) return;

        socket.on('staff_notification', () => {
            mutateTables();
            mutateWaitingOrders();
            if (selectedTableId) mutateActiveOrders();
        });

        socket.on('PAYMENT_SUCCESS', (data: any) => {
            setIsPaymentSuccess(true);
            mutateTables();
            if (selectedTableId) mutateActiveOrders();

            setTimeout(() => {
                setVnpayUrl(null);
                setIsPaymentSuccess(false);
            }, 4000);
        });

        return () => {
            socket.off('staff_notification');
            socket.off('PAYMENT_SUCCESS');
        };
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
        try {
            // Cập nhật Optimistic (Cập nhật cache local ngay lập tức)
            mutateActiveOrders((currentOrders: any) => {
                if (!currentOrders) return currentOrders;
                return currentOrders.map((o: any) =>
                    o.id === id ? { ...o, status: status } : o
                );
            }, false);

            await orderService.updateStatus(id, status);

            // Sau khi thành công, re-fetch chuẩn
            mutateActiveOrders();
            mutateWaitingOrders();
            mutateTables();
        } catch (error) {
            console.error('[POS] Lỗi khi cập nhật trạng thái:', error);
            alert('Không thể cập nhật trạng thái đơn hàng');
            mutateActiveOrders();
        }
    };

    const handleCheckout = async (paymentMethod: string = 'CASH') => {
        if (!selectedTableId || !selectedTable) return;
        const ids = selectedOrderIds.length > 0 ? selectedOrderIds : undefined;
        const result = await checkoutTable(selectedTableId, ids, paymentMethod);

        if (paymentMethod === 'E_WALLET' && result?.invoiceId) {
            try {
                const payRes = await api.post('/payment/vnpay/create-url', { invoiceId: result.invoiceId });
                if (payRes.data.url) {
                    setIsPaymentSuccess(false);
                    setVnpayUrl(payRes.data.url);
                }
            } catch (error) {
                console.error('Lỗi tạo thanh toán VNPay:', error);
                alert('Không thể tạo liên kết thanh toán VNPay');
            }
        }

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

        const subTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

        return {
            subTotal,
            totalDiscount,
            finalTotal: Math.max(0, subTotal - totalDiscount)
        };
    };

    const toggleOrderSelection = (id: string) => {
        setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]);
    };

    return {
        selectedTableId, setSelectedTableId,
        unreadTables, unreadTableIds, markTableAsRead,
        selectedOrderIds, toggleOrderSelection,
        vnpayUrl, setVnpayUrl,
        isPaymentSuccess, setIsPaymentSuccess,
        tables, isTablesLoading,
        activeOrders, isOrdersLoading,
        waitingOrders,
        selectedTable,
        socket,
        handleApprove, handleCancel, handleUpdateStatus, handleCheckout, handleMoveOrder, handleMergeTables,
        calculateTotal,
        mutateTables, mutateWaitingOrders, mutateReservations,
        activeReservations
    };
};
