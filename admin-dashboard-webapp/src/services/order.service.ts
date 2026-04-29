import api from './axios';

export interface OrderItem {
    id: string;
    quantity: number;
    priceAtTime: number;
    notes: string;
    menuItem: {
        name: string;
        imageUrl: string | null;
    }
}

export interface Order {
    id: string;
    status: 'WAITING_APPROVAL' | 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
    totalAmount: number;
    discountAmount?: number;
    voucherCode?: string;
    items: OrderItem[];
    createdAt: string;
    tableId: string;
}

export const orderService = {
    getOrders: async (params?: { status?: string, tableId?: string, onlyActive?: boolean }): Promise<Order[]> => {
        const res = await api.get('/orders', { params });
        return res.data;
    },
    updateStatus: async (id: string, status: string): Promise<Order> => {
        const res = await api.patch(`/orders/${id}/status`, { status });
        return res.data;
    },
    moveOrder: async (orderId: string, targetTableId: string): Promise<any> => {
        const res = await api.post('/orders/move', { orderId, targetTableId });
        return res.data;
    }
};
