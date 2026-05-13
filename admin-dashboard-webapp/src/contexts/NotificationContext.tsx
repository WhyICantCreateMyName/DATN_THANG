'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useOrders } from '@/hooks/useOrders';
import { useTable } from '@/hooks/useTable';

export interface StaffNotification {
    id: string;
    type: string;
    tableId?: string;
    tableName?: string;
    message: string;
    createdAt: Date;
    isRead: boolean;
}

interface NotificationContextType {
    waitingOrders: any[];
    staffNotifications: StaffNotification[];
    unreadTableIds: string[];
    tables: any[];
    isTablesLoading: boolean;
    
    // Quản lý bàn đang được chọn xử lý
    activeTableId: string | null;
    setActiveTableId: (id: string | null) => void;
    
    mutateAll: () => void;
    markAsRead: (id: string) => void;
    markTableAsRead: (tableId: string) => void;
    markAllTableNotificationsAsRead: (tableId: string) => void;
    clearNotifications: () => void;
    isPaymentSuccess: boolean;
    setIsPaymentSuccess: (val: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const socket = useSocket();
    
    // State quản lý bàn đang làm việc (Single Source of Truth)
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    
    const [staffNotifications, setStaffNotifications] = useState<StaffNotification[]>([]);
    const [unreadTableIds, setUnreadTableIds] = useState<string[]>([]);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    
    const audioAlarmRef = useRef<HTMLAudioElement | null>(null);
    const audioTingRef = useRef<HTMLAudioElement | null>(null);

    const { tables, isLoading: isTablesLoading, mutateTables } = useTable();
    const { orders: waitingOrders = [], mutate: mutateWaitingOrders } = useOrders({ status: 'WAITING_APPROVAL' });

    const handlersRef = useRef({ mutateTables, mutateWaitingOrders });
    useEffect(() => {
        handlersRef.current = { mutateTables, mutateWaitingOrders };
    }, [mutateTables, mutateWaitingOrders]);

    const mutateAll = useCallback(() => {
        handlersRef.current.mutateTables();
        handlersRef.current.mutateWaitingOrders();
    }, []);

    const markTableAsRead = useCallback((tableId: string) => {
        setUnreadTableIds(prev => prev.filter(tid => tid !== tableId));
    }, []);

    const markAsRead = useCallback((id: string) => {
        setStaffNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const markAllTableNotificationsAsRead = useCallback((tableId: string) => {
        setStaffNotifications(prev => prev.map(n => n.tableId === tableId ? { ...n, isRead: true } : n));
        markTableAsRead(tableId);
    }, [markTableAsRead]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioAlarmRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audioTingRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/931/931.wav');
        }
    }, []);

    // 🧠 Tự động đánh dấu đã đọc khi activeTableId thay đổi
    useEffect(() => {
        if (activeTableId && unreadTableIds.includes(activeTableId)) {
            markAllTableNotificationsAsRead(activeTableId);
        }
    }, [activeTableId, unreadTableIds, markAllTableNotificationsAsRead]);

    useEffect(() => {
        if (!socket) return;

        const handleStaffNotification = (data: any) => {
            mutateAll();

            // Kiểm tra xem có phải bàn đang chọn không
            const isCurrentlyViewing = activeTableId === data.tableId && data.type !== 'NEW_ORDER';

            if (data.type === 'NEW_ORDER') {
                if (audioAlarmRef.current) {
                    audioAlarmRef.current.loop = true;
                    audioAlarmRef.current.play().catch(() => { });
                }
            } else {
                if (!isCurrentlyViewing && audioTingRef.current) {
                    audioTingRef.current.currentTime = 0;
                    audioTingRef.current.play().catch(() => { });
                }
                
                if (data.tableId && (data.type === 'NEW_MESSAGE' || data.type === 'CALL_STAFF')) {
                    if (!isCurrentlyViewing) {
                        setUnreadTableIds(prev => prev.includes(data.tableId) ? prev : [...prev, data.tableId]);
                    }
                }
            }

            if (data.message) {
                const newNotif: StaffNotification = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: data.type || 'NOTIFICATION',
                    tableId: data.tableId,
                    tableName: data.tableName,
                    message: data.message,
                    createdAt: new Date(),
                    isRead: isCurrentlyViewing
                };
                setStaffNotifications(prev => [newNotif, ...prev].slice(0, 50));
            }
        };

        const handlePaymentSuccess = () => {
            setIsPaymentSuccess(true);
            mutateAll();
            setTimeout(() => setIsPaymentSuccess(false), 5000);
        };

        socket.on('staff_notification', handleStaffNotification);
        socket.on('PAYMENT_SUCCESS', handlePaymentSuccess);
        socket.emit('join_staff_room');

        return () => {
            socket.off('staff_notification', handleStaffNotification);
            socket.off('PAYMENT_SUCCESS', handlePaymentSuccess);
        };
    }, [socket, mutateAll, activeTableId]);

    useEffect(() => {
        if (waitingOrders.length === 0 && audioAlarmRef.current) {
            audioAlarmRef.current.pause();
            audioAlarmRef.current.currentTime = 0;
        }
    }, [waitingOrders.length]);

    const clearNotifications = useCallback(() => {
        setStaffNotifications([]);
        setUnreadTableIds([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            activeTableId,
            setActiveTableId,
            waitingOrders,
            staffNotifications,
            unreadTableIds,
            tables: tables || [],
            isTablesLoading,
            mutateAll,
            markAsRead,
            markTableAsRead,
            markAllTableNotificationsAsRead,
            clearNotifications,
            isPaymentSuccess,
            setIsPaymentSuccess
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotificationContext must be used within a NotificationProvider');
    return context;
};
