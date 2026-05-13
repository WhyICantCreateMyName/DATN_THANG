import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { chatService, Message } from '@/services/chat.service';
import { useSocket } from '@/hooks/useSocket';

export const useChat = (tableId: string | null) => {
    const socket = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);

    const { data: history, mutate, isLoading } = useSWR(
        tableId ? ['chat', tableId] : null,
        () => chatService.getMessages(tableId!)
    );

    useEffect(() => {
        if (history?.data) {
            setMessages(history.data);
        }
    }, [history]);

    useEffect(() => {
        if (!socket || !tableId) return;

        const handleNewMessage = (msg: Message) => {
            if (msg.chatSessionId === history?.sessionId) {
                setMessages(prev => {
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

    const sendMessage = async (content: string, senderId: string) => {
        if (!tableId || !history?.sessionId) return;

        const messageData = {
            tableId,
            chatSessionId: history.sessionId,
            content,
            senderType: 'STAFF' as const,
            senderId
        };

        try {
            await chatService.sendMessage(messageData);
        } catch (error: any) {
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
