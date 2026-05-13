import { useState, useEffect } from 'react';
import api from '@/services/axios';
import { useSocket } from './useSocket';

export interface OrderHistory {
    id: string;
    totalAmount: number;
    discountAmount: number;
    voucherCode: string | null;
    status: string;
    createdAt: string;
    items: {
        quantity: number;
        menuItem: {
            name: string;
            price: number;
            imageUrl: string | null;
        };
    }[];
}

export const useRestaurantData = (qrCode?: string) => {
    const socket = useSocket();
    const [tableName, setTableName] = useState('');
    const [tableId, setTableId] = useState('');
    const [chatSessionId, setChatSessionId] = useState('');
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [initialMessages, setInitialMessages] = useState([]);
    const [statusNotification, setStatusNotification] = useState<{ message: string, type: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Identify Table & Session
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (qrCode) {
                    const guestId = localStorage.getItem('restaurant_guest_id');
                    const res = await api.get(`/tables/qrcode/${qrCode}?guestId=${guestId}`);
                    const { table, chatSession, orders } = res.data.data;

                    if (table) {
                        setTableId(table.id);
                        setTableName(table.name);
                        localStorage.setItem('restaurant_table_id', table.id);
                        localStorage.setItem('restaurant_table_name', table.name);
                    }

                    if (chatSession) {
                        setChatSessionId(chatSession.id);
                        setInitialMessages(chatSession.messages || []);
                        localStorage.setItem('restaurant_chat_session_id', chatSession.id);
                    }

                    if (orders) {
                        setOrderHistory(orders);
                    }

                    if (table && !chatSession) {
                        const reloadKey = `reload_session_${table.id}`;
                        if (!sessionStorage.getItem(reloadKey)) {
                            sessionStorage.setItem(reloadKey, 'true');
                            window.location.reload();
                        }
                    }
                } else {
                    // Load from local storage if no QR
                    const storedName = localStorage.getItem('restaurant_table_name');
                    const storedId = localStorage.getItem('restaurant_table_id');
                    const storedSessionId = localStorage.getItem('restaurant_chat_session_id');

                    if (storedName) setTableName(storedName);
                    if (storedId) setTableId(storedId);
                    if (storedSessionId) setChatSessionId(storedSessionId);
                }
            } catch (err) {
                console.error('Failed to load restaurant data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [qrCode]);

    // 2. Real-time Status Updates
    useEffect(() => {
        if (!socket || !tableId) return;

        // Đảm bảo khách hàng ở trong phòng của bàn để nhận thông báo trạng thái đơn
        const joinRoom = () => {
            console.log(`📍 [Restaurant Data] Joining table room: table_${tableId}`);
            socket.emit('join_table', tableId);
        };

        joinRoom();
        socket.on('connect', joinRoom);

        const handleStatusUpdate = (data: { orderId: string, status: string, message: string }) => {
            setOrderHistory(prev => prev.map(order =>
                order.id === data.orderId ? { ...order, status: data.status } : order
            ));

            setStatusNotification({ message: data.message, type: data.status });
            setTimeout(() => setStatusNotification(null), 5000);
        };

        socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

        // Listen for session end to cleanup
        socket.on('SESSION_ENDED', () => {
            localStorage.removeItem('restaurant_chat_session_id');
            window.location.reload();
        });

        return () => {
            socket.off('connect', joinRoom);
            socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
            socket.off('SESSION_ENDED');
        };
    }, [socket, tableId]);

    const refreshHistory = async () => {
        if (qrCode) {
            const guestId = localStorage.getItem('restaurant_guest_id');
            const res = await api.get(`/tables/qrcode/${qrCode}?guestId=${guestId}`);
            setOrderHistory(res.data.data.orders);
        }
    };

    return {
        tableName,
        tableId,
        chatSessionId,
        orderHistory,
        initialMessages,
        statusNotification,
        isLoading,
        socket,
        refreshHistory
    };
};
