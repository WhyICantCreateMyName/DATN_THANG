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

    // 3. Hàm gửi tin nhắn (Thông qua Socket)
    const sendMessage = async (content: string, senderId: string) => {
        if (!socket || !tableId || !history?.sessionId) return;

        const messageData = {
            tableId,
            chatSessionId: history.sessionId,
            content,
            senderType: 'STAFF',
            senderId
        };

        // Gửi qua socket
        socket.emit('send_message', messageData);
    };

    return {
        messages,
        sendMessage,
        sessionId: history?.sessionId,
        isLoading
    };
};
