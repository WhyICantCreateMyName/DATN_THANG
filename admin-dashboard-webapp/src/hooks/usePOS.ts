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
import { printInvoice } from '@/utils/printInvoice';

export const usePOS = () => {
    const {
        waitingOrders,
        mutateAll,
        unreadTableIds,
        markTableAsRead,
        tables,
        isTablesLoading,
        isPaymentSuccess,
        setIsPaymentSuccess,
        activeTableId,
        setActiveTableId
    } = useNotificationContext();

    // Dùng chung state từ Context để tự động đồng bộ thông báo
    const selectedTableId = activeTableId;
    const setSelectedTableId = setActiveTableId;

    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO' | 'CASH' | 'CARD'>('CASH');

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

    const selectedTable = useMemo(() => tables?.find((t: any) => t.id === selectedTableId), [tables, selectedTableId]);

    // 6. Hành động
    const handleApprove = async (id: string) => {
        await approveOrder(id);
        mutateAll();
        mutateActiveOrders();
    };

    const handleCancel = async (id: string) => {
        await cancelOrder(id);
        mutateActiveOrders();
        mutateAll();
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            mutateActiveOrders((currentOrders: any) => {
                if (!currentOrders) return currentOrders;
                return currentOrders.map((o: any) =>
                    o.id === id ? { ...o, status: status } : o
                );
            }, false);

            await orderService.updateStatus(id, status);

            mutateActiveOrders();
            mutateAll();
        } catch (error) {
            console.error('[POS] Lỗi khi cập nhật trạng thái:', error);
            mutateActiveOrders();
        }
    };

    const handleCheckout = async (paymentMethod: string = 'CASH') => {
        if (!selectedTableId || !selectedTable) return;

        const isOnline = paymentMethod === 'VNPAY' || paymentMethod === 'MOMO';
        
        // 1. Mở sẵn một tab trắng ngay khi click chuột để tránh bị trình duyệt chặn Popup (tránh chạy sau await)
        const paymentTab = isOnline ? window.open('about:blank', '_blank') : null;
        
        const ids = selectedOrderIds.length > 0 ? selectedOrderIds : undefined;
        
        // Trích xuất orders và totals cần in trước khi gọi checkout và bị mutate
        const ordersToPrint = selectedOrderIds.length > 0
            ? (activeOrders || []).filter(o => selectedOrderIds.includes(o.id))
            : (activeOrders || []);
        
        const totalsToPrint = calculateTotal();

        try {
            const result = await tableService.checkoutTable(selectedTableId, ids, paymentMethod);
            console.log(paymentMethod, result);

            if (isOnline && result?.invoiceId) {
                const endpoint = paymentMethod === 'VNPAY' ? '/payment/vnpay/create-url' : '/payment/momo/create-url';
                const payRes = await api.post(endpoint, { 
                    invoiceId: result.invoiceId,
                    redirectUrl: window.location.origin + '/payment-result'
                });

                if (payRes.data.url && paymentTab) {
                    // Chuyển hướng tab đã mở sẵn sang link cổng thanh toán
                    paymentTab.location.href = payRes.data.url;
                } else if (paymentTab) {
                    paymentTab.close();
                }
            } else if (paymentTab) {
                paymentTab.close();
            }
        } catch (error) {
            console.error('Lỗi trong quá trình thanh toán:', error);
            if (paymentTab) paymentTab.close();
        }

        // 2. Kích hoạt in hóa đơn bằng Iframe ẩn ngay lập tức sau khi luồng bất đồng bộ trên đã mở tab thành công
        // Do lúc này tab QR đã được mở và đang tải độc lập, việc gọi print dialog sẽ không gây ảnh hưởng hay chặn luồng
        printInvoice({
            tableName: selectedTable.name,
            orders: ordersToPrint,
            totals: totalsToPrint,
            paymentMethod
        });

        setSelectedOrderIds([]);
        mutateAll(); 
        mutateActiveOrders();
    };

    const handleMoveOrder = async (orderId: string, targetTableId: string) => {
        await orderService.moveOrder(orderId, targetTableId);
        mutateAll();
        mutateActiveOrders();
    };

    const handleMergeTables = async (sourceId: string, targetId: string) => {
        await tableService.mergeTables(sourceId, targetId);
        mutateAll();
        if (sourceId === selectedTableId) setSelectedTableId(targetId);
        mutateActiveOrders();
    };

    const calculateTotal = () => {
        const orders = selectedOrderIds.length > 0
            ? (activeOrders || []).filter(o => selectedOrderIds.includes(o.id))
            : (activeOrders || []);

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
        unreadTables: unreadTableIds, unreadTableIds, markTableAsRead,
        selectedOrderIds, toggleOrderSelection,
        paymentUrl, setPaymentUrl,
        paymentMethod, setPaymentMethod,
        isPaymentSuccess, setIsPaymentSuccess,
        tables, isTablesLoading,
        activeOrders: activeOrders || [], isOrdersLoading,
        waitingOrders,
        selectedTable,
        handleApprove, handleCancel, handleUpdateStatus, handleCheckout, handleMoveOrder, handleMergeTables,
        calculateTotal,
        mutateTables: mutateAll, mutateWaitingOrders: mutateAll, mutateReservations,
        activeReservations
    };
};
