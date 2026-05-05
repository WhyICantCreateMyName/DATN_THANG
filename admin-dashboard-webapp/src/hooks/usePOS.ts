import { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import api from '@/services/axios';
import { useTable } from '@/hooks/useTable';
import { useOrders } from '@/hooks/useOrders';
import { useSocket } from '@/hooks/useSocket';
import { orderService } from '@/services/order.service';
import { tableService } from '@/services/table.service';
import { reservationService } from '@/services/reservation.service';

export const usePOS = () => {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [unreadTables, setUnreadTables] = useState<string[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [vnpayUrl, setVnpayUrl] = useState<string | null>(null);

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

    // 4. Lịch hẹn đặt bàn
    const { data: reservations, mutate: mutateReservations } = useSWR(
        ['reservations'],
        () => reservationService.getReservations(),
        { refreshInterval: 30000 }
    );

    const activeReservations = useMemo(() =>
        reservations?.filter((r: any) => ['PENDING', 'CONFIRMED', 'ARRIVED'].includes(r.status)) || [],
        [reservations]);

    const selectedTable = useMemo(() => tables?.find(t => t.id === selectedTableId), [tables, selectedTableId]);

    // 4. Âm thanh thông báo
    useEffect(() => {
        if (!audioRef.current) return;
        if (waitingOrders.length > 0) {
            audioRef.current.loop = true;
            audioRef.current.play().catch(() => { });
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
                notificationAudioRef.current.play().catch(() => { });
            }

            if (data.type === 'NEW_MESSAGE' && data.tableId !== selectedTableId) {
                setUnreadTables(prev => Array.from(new Set([...prev, data.tableId])));
            }

            mutateTables();
            mutateWaitingOrders();
            if (selectedTableId) mutateActiveOrders();
        });

        // Lắng nghe sự kiện thanh toán thành công để đóng QR Modal
        socket.on('PAYMENT_SUCCESS', (data: any) => {
            console.log('Nhận thông báo thanh toán thành công:', data);
            setVnpayUrl(null); // Đóng Modal
            mutateTables();
            if (selectedTableId) mutateActiveOrders();
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
        await orderService.updateStatus(id, status);
        mutateActiveOrders(); mutateWaitingOrders(); mutateTables();
    };

    const handleCheckout = async (paymentMethod: string = 'CASH') => {
        if (!selectedTableId || !selectedTable) return;
        const ids = selectedOrderIds.length > 0 ? selectedOrderIds : undefined;
        const result = await checkoutTable(selectedTableId, ids, paymentMethod);
        
        if (paymentMethod === 'E_WALLET' && result?.invoiceId) {
            try {
                const payRes = await api.post('/payment/vnpay/create-url', { invoiceId: result.invoiceId });
                if (payRes.data.url) {
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
        unreadTables, setUnreadTables,
        selectedOrderIds, toggleOrderSelection,
        vnpayUrl, setVnpayUrl,
        tables, isTablesLoading,
        activeOrders, isOrdersLoading,
        waitingOrders,
        selectedTable,
        audioRef, notificationAudioRef,
        socket,
        handleApprove, handleCancel, handleUpdateStatus, handleCheckout, handleMoveOrder, handleMergeTables,
        calculateTotal,
        mutateTables, mutateWaitingOrders, mutateReservations,
        activeReservations
    };
};
