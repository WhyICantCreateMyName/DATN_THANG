import api from './axios';

export interface Message {
    id: string;
    content: string;
    senderType: 'CUSTOMER' | 'STAFF';
    senderId: string;
    createdAt: string;
    chatSessionId: string;
}

export interface ChatHistoryResponse {
    data: Message[];
    sessionId: string;
}

export const chatService = {
    getMessages: async (tableId: string): Promise<ChatHistoryResponse> => {
        const res = await api.get(`/chat/${tableId}/messages`);
        return res.data;
    }
};
