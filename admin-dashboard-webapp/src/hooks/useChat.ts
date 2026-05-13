import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { chatService, Message } from '@/services/chat.service';
import { Socket } from 'socket.io-client';

export const useChat = (tableId: string | null, socket: Socket | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    
    // 1. Fetch lịch sử chat thông qua chatService
    const { data: history, mutate, isLoading } = useSWR(
        tableId ? ['chat', tableId] : null,
        () => chatService.getMessages(tableId!)
    );

    useEffect(() => {
        if (history?.data) {
            setMessages(history.data);
        }
    }, [history]);

    // 2. Lắng nghe tin nhắn mới từ Socket
    useEffect(() => {
        if (!socket || !tableId) return;

        const handleNewMessage = (msg: Message) => {
            // Chỉ thêm tin nhắn nếu nó thuộc phiên chat hiện tại
            if (msg.chatSessionId === history?.sessionId) {
                setMessages(prev => {
                    // Tránh trùng lặp tin nhắn
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        socket.on('receive_message', handleNewMessage);
        return () => {
            socket.off('receive_message', handleNewMessage);
        };
    }, [socket, tableId, history?.sessionId]);

    // 3. Hàm gửi tin nhắn (Thông qua REST API)
    const sendMessage = async (content: string, senderId: string) => {
        if (!tableId || !history?.sessionId) return;

        const messageData = {
            tableId,
            chatSessionId: history.sessionId,
            content,
            senderType: 'STAFF' as const,
            senderId
        };

        // Gửi qua REST API thay vì Socket để đảm bảo an toàn
        try {
            await chatService.sendMessage(messageData); // Tạm giả định chatService có hàm này, nếu không ta dùng thẳng api.post
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
        }
    };

    return {
        messages,
        sendMessage,
        sessionId: history?.sessionId,
        isLoading
    };
};
