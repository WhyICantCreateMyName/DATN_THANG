import useSWR from 'swr';
import { orderService, Order } from '../services/order.service';

export const useOrders = (params?: { status?: string, tableId?: string, onlyActive?: boolean }) => {
    // Key của SWR sẽ thay đổi khi params (như tableId) thay đổi, giúp tự động refetch
    const { data: orders, error, mutate, isLoading } = useSWR(
        ['orders', params?.status, params?.tableId, params?.onlyActive],
        () => orderService.getOrders(params),
        {
            refreshInterval: 10000, // Tự động làm mới mỗi 10s (phù hợp cho POS/Bếp)
            revalidateOnFocus: true
        }
    );

    const approveOrder = async (orderId: string) => {
        await orderService.updateStatus(orderId, 'PENDING');
        mutate(); // Cập nhật lại cache SWR ngay lập tức
    };

    const cancelOrder = async (orderId: string) => {
        await orderService.updateStatus(orderId, 'CANCELLED');
        mutate();
    };

    return {
        orders: orders || [],
        isLoading,
        isError: error,
        mutate,
        approveOrder,
        cancelOrder
    };
};
