import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import api from '@/services/axios';

export interface Message {
  id: string;
  content: string;
  senderType: 'CUSTOMER' | 'STAFF';
  senderId: string;
  createdAt: string;
}

export const useCustomerChat = (tableId: string, chatSessionId: string, initialMessages: Message[] = []) => {
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [guestId, setGuestId] = useState('');

  // 1. Guest ID Persistence
  useEffect(() => {
    let id = localStorage.getItem('restaurant_guest_id');
    if (!id) {
      id = `guest_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('restaurant_guest_id', id);
    }
    setGuestId(id);
  }, []);

  // 2. Sync Initial Messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages((prev) => {
        const combined = [...initialMessages, ...prev];
        const uniqueMessages = Array.from(
          new Map(combined.map((m) => [m.id, m])).values()
        );
        return uniqueMessages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    }
  }, [initialMessages]);

  // 3. Socket Event Handling
  useEffect(() => {
    if (!socket || !tableId) return;

    // Hàm thực hiện join vào phòng của bàn
    const joinRoom = () => {
      console.log(`📍 [Customer Chat] Đang tham gia phòng của bàn: table_${tableId}`);
      socket.emit('join_table', tableId);
    };

    // Thực hiện join ngay lập tức
    joinRoom();

    // Lắng nghe sự kiện connect để join lại nếu bị mất mạng rồi có lại
    socket.on('connect', joinRoom);

    const handleMessage = (message: Message) => {
      setMessages((prev) => {
        // Tránh trùng tin nhắn nếu fetch lại history cùng lúc
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('receive_message', handleMessage);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', handleMessage);
    };
  }, [socket, tableId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const messageData = {
      chatSessionId,
      tableId,
      content,
      senderType: 'CUSTOMER',
      senderId: guestId
    };

    if (!chatSessionId || !tableId) return;

    try {
      await api.post('/chat/messages', messageData);
    } catch (error: any) {
      console.error('❌ [Customer Chat] Lỗi gửi tin nhắn:', error);
    }
  }, [tableId, chatSessionId, guestId]);

  const callStaff = useCallback((tableName: string) => {
    if (!socket || !chatSessionId) return;
    socket.emit('call_staff', { tableId, tableName, chatSessionId, senderId: guestId });
  }, [socket, tableId, chatSessionId, guestId]);

  return {
    messages,
    guestId,
    sendMessage,
    callStaff,
    socket
  };
};
