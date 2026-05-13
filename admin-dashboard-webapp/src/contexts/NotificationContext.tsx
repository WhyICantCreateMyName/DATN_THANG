'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useOrders } from '@/hooks/useOrders';

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
    mutateWaitingOrders: () => void;
    staffNotifications: StaffNotification[];
    unreadTableIds: string[];
    markAsRead: (id: string) => void;
    markTableAsRead: (tableId: string) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const socket = useSocket();
    const [staffNotifications, setStaffNotifications] = useState<StaffNotification[]>([]);
    const [unreadTableIds, setUnreadTableIds] = useState<string[]>([]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioNotificationRef = useRef<HTMLAudioElement | null>(null);

    const { orders: waitingOrders, mutate: mutateWaitingOrders } = useOrders({ status: 'WAITING_APPROVAL' });
    const orders = waitingOrders || [];

    const [isAudioBlocked, setIsAudioBlocked] = useState(false);

    // Khởi tạo Audio bền bỉ và kiểm tra quyền tự động phát
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audioNotificationRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/931/931.wav');

            // Thử phát âm thanh câm để kiểm tra xem trình duyệt có chặn không
            const testPlay = audioNotificationRef.current.play();
            if (testPlay !== undefined) {
                testPlay.then(() => {
                    audioNotificationRef.current?.pause();
                    setIsAudioBlocked(false);
                }).catch(() => {
                    console.log('🔇 Trình duyệt đã chặn auto-play. Hiển thị cảnh báo UI.');
                    setIsAudioBlocked(true);
                });
            }
        }
    }, []);

    // Điều khiển chuông báo động đơn hàng (Lặp lại)
    const playAlarm = useCallback(() => {
        if (audioRef.current && orders.length > 0) {
            audioRef.current.loop = true;
            audioRef.current.play().catch(() => setIsAudioBlocked(true));
        }
    }, [orders.length]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (orders.length > 0) {
            playAlarm();
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [orders.length, playAlarm]);

    // Unlock audio (Global click)
    useEffect(() => {
        const unlockAudio = () => {
            console.log('🔓 [Audio] Mở khóa âm thanh từ người dùng');
            [audioRef.current, audioNotificationRef.current].forEach(audio => {
                if (audio) {
                    audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => { });
                }
            });
            setIsAudioBlocked(false);
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    // Persistence
    useEffect(() => {
        const savedNotifs = localStorage.getItem('staff_notifications');
        const savedTables = localStorage.getItem('unread_table_ids');
        if (savedNotifs) {
            try {
                const parsed = JSON.parse(savedNotifs);
                setStaffNotifications(parsed.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })));
            } catch (e) { }
        }
        if (savedTables) {
            try { setUnreadTableIds(JSON.parse(savedTables)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('staff_notifications', JSON.stringify(staffNotifications));
        localStorage.setItem('unread_table_ids', JSON.stringify(unreadTableIds));
    }, [staffNotifications, unreadTableIds]);

    const markAsRead = useCallback((id: string) => {
        setStaffNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const markTableAsRead = useCallback((tableId: string) => {
        setUnreadTableIds(prev => prev.filter(id => id !== tableId));
        setStaffNotifications(prev => prev.filter(n => n.tableId !== tableId));
    }, []);

    const clearNotifications = useCallback(() => {
        setStaffNotifications([]);
        setUnreadTableIds([]);
    }, []);

    // Lắng nghe Socket
    useEffect(() => {
        console.log('🔌 [NotificationContext] Kiểm tra Socket:', socket ? 'Đã có đối tượng' : 'Đang chờ...');
        if (!socket) return;

        console.log('📡 [NotificationContext] Bắt đầu lắng nghe sự kiện...');

        const handleUpdate = (data: any) => {
            console.log('📩 [Socket Event Received]:', data);
            mutateWaitingOrders();

            // Nếu là đơn hàng mới, kích hoạt âm thanh báo động ngay lập tức
            if (data.type === 'NEW_ORDER') {
                console.log('🔔 [Alarm] Có đơn hàng mới!');
                if (audioRef.current) {
                    audioRef.current.loop = true;
                    audioRef.current.play().catch(() => { });
                }
            }

            if (data?.tableId && data.type !== 'ORDER_UPDATED') {
                // Cập nhật thẻ Unread cho bàn (nếu không phải đơn hàng mới, vì đơn hàng đã hiển thị rõ ràng trên POS)
                if (data.type !== 'NEW_ORDER') {
                    setUnreadTableIds(prev => prev.includes(data.tableId) ? prev : [...prev, data.tableId]);

                    const newNotif: StaffNotification = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: data.type || 'NOTIFICATION',
                        tableId: data.tableId,
                        tableName: data.tableName || data.tableId,
                        message: data.message || `Thông báo mới`,
                        createdAt: new Date(),
                        isRead: false
                    };
                    setStaffNotifications(prev => [newNotif, ...prev].slice(0, 50));
                }

                // Ting Ting cho tin nhắn và gọi phục vụ
                if (data.type !== 'NEW_ORDER' && audioNotificationRef.current) {
                    console.log('🎵 [Ting Ting] Phát âm thanh cho tin nhắn/gọi nhân viên');
                    const audio = audioNotificationRef.current;
                    const playShort = () => {
                        audio.currentTime = 0;
                        audio.play().catch(() => { });
                        setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 500);
                    };
                    playShort();
                    setTimeout(playShort, 600);
                }
            }
        };

        socket.on('staff_notification', handleUpdate);
        socket.emit('join_staff_room');

        return () => {
            console.log('🔌 [NotificationContext] Hủy lắng nghe Socket');
            socket.off('staff_notification', handleUpdate);
        };
    }, [socket, mutateWaitingOrders]);

    return (
        <NotificationContext.Provider value={{
            waitingOrders: orders,
            mutateWaitingOrders,
            staffNotifications,
            unreadTableIds,
            markAsRead,
            markTableAsRead,
            clearNotifications
        }}>
            {children}
            {/* Giao diện cảnh báo trình duyệt chặn âm thanh */}
            {isAudioBlocked && (
                <div
                    className="fixed bottom-8 right-8 z-50 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.7)] cursor-pointer flex items-center gap-3 animate-bounce border-2 border-white transition-all duration-300"
                    onClick={() => {
                        [audioRef.current, audioNotificationRef.current].forEach(audio => {
                            if (audio) {
                                audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => { });
                            }
                        });
                        setIsAudioBlocked(false);
                    }}
                >
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    <span className="font-semibold tracking-wide">Trình duyệt đã tắt âm. Click để bật tiếng!</span>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotificationContext must be used within a NotificationProvider');
    return context;
};
