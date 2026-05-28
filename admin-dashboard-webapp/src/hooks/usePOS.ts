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

    // Lưu trữ thông tin đơn hàng hiện tại trước khi checkout (để in hóa đơn phòng khi bị xóa/mutate)
    const checkoutContextRef = useRef<{
        tableName: string;
        orders: any[];
        totals: { subTotal: number; totalDiscount: number; finalTotal: number };
        paymentMethod: string;
    } | null>(null);

    // Lắng nghe trạng thái thanh toán online thành công để tự động in hóa đơn
    useEffect(() => {
        if (isPaymentSuccess && checkoutContextRef.current) {
            printInvoice({
                tableName: checkoutContextRef.current.tableName,
                orders: checkoutContextRef.current.orders,
                totals: checkoutContextRef.current.totals,
                paymentMethod: paymentMethod // Dùng đúng phương thức online VNPAY/MOMO hiện tại
            });
            // Reset context sau khi in
            checkoutContextRef.current = null;
        }
    }, [isPaymentSuccess, paymentMethod]);

    const handleCheckout = async (paymentMethod: string = 'CASH') => {
        if (!selectedTableId || !selectedTable) return;
        
        const ids = selectedOrderIds.length > 0 ? selectedOrderIds : undefined;
        
        // Trích xuất orders và totals cần in trước khi gọi checkout và bị mutate
        const ordersToPrint = selectedOrderIds.length > 0
            ? (activeOrders || []).filter(o => selectedOrderIds.includes(o.id))
            : (activeOrders || []);
        
        const totalsToPrint = calculateTotal();

        // Lưu thông tin phục vụ việc in
        checkoutContextRef.current = {
            tableName: selectedTable.name,
            orders: ordersToPrint,
            totals: totalsToPrint,
            paymentMethod
        };

        const result = await tableService.checkoutTable(selectedTableId, ids, paymentMethod);

        console.log(paymentMethod, result);

        if ((paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') && result?.invoiceId) {
            try {
                const endpoint = paymentMethod === 'VNPAY' ? '/payment/vnpay/create-url' : '/payment/momo/create-url';
                const payRes = await api.post(endpoint, { 
                    invoiceId: result.invoiceId,
                    redirectUrl: window.location.origin + '/payment-result'
                });

                if (payRes.data.url) {
                    setIsPaymentSuccess(false);
                    setPaymentMethod(paymentMethod);
                    setPaymentUrl(payRes.data.url);
                }
            } catch (error) {
                console.error(`Lỗi tạo thanh toán ${paymentMethod}:`, error);
            }
        } else if (paymentMethod === 'CASH') {
            // Thanh toán tiền mặt thành công trực tiếp -> In hóa đơn ngay lập tức
            if (checkoutContextRef.current) {
                printInvoice(checkoutContextRef.current);
                checkoutContextRef.current = null;
            }
        }

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
