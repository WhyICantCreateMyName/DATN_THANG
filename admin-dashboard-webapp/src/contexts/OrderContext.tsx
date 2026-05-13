'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Order } from '@/services/order.service';
import { useSocket } from '@/hooks/useSocket';
import { useOrders } from '@/hooks/useOrders';

interface OrderContextType {
    waitingOrders: Order[];
    mutateWaitingOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
    const socket = useSocket();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sử dụng hook useOrders tập trung
    const { orders: waitingOrders, mutate: mutateWaitingOrders } = useOrders({ status: 'WAITING_APPROVAL' });

    const orders = waitingOrders || [];

    // Logic âm thanh: Loop nếu có đơn chờ duyệt
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        }

        if (orders.length > 0) {
            audioRef.current.loop = true;
            audioRef.current.play().catch(() => {
                console.warn('Audio play blocked by browser policy. User interaction required.');
            });
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [orders.length]);

    // Lắng nghe socket để refresh dữ liệu
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            mutateWaitingOrders();
        };

        socket.on('staff_notification', handleUpdate);
        socket.on('PAYMENT_SUCCESS', handleUpdate);

        return () => {
            socket.off('staff_notification', handleUpdate);
            socket.off('PAYMENT_SUCCESS');
        };
    }, [socket, mutateWaitingOrders]);

    return (
        <OrderContext.Provider value={{ waitingOrders: orders, mutateWaitingOrders }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrderContext = () => {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrderContext must be used within an OrderProvider');
    }
    return context;
};
