'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Send, User, Bell, Search, Hash } from 'lucide-react';
import api from '@/services/axios';
import constants from '@/constants';
import { useAuthContext } from '@/contexts/AuthContext';

interface ChatMessage {
    id: string;
    content: string;
    senderType: 'CUSTOMER' | 'STAFF';
    senderId: string;
    createdAt: string;
    chatSessionId: string;
}

interface ChatSession {
    id: string;
    isActive: boolean;
    tableId: string;
    table: {
        name: string;
    };
    messages: ChatMessage[];
}

export default function StaffChatCenter() {
    const { user } = useAuthContext();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    useEffect(() => {
        // Khởi tạo audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'); // mượn tạm 1 link mp3 ting ting

        // Fetch danh sách các phiên chat đang active
        const fetchSessions = async () => {
            try {
                const res = await api.get('/chat-sessions/active');
                setSessions(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedSessionId(res.data.data[0].id);
                }
            } catch (err) {
                console.error('Lỗi lấy danh sách chat:', err);
            }
        };
        fetchSessions();

        // Socket logic
        const newSocket = io(constants.url.api.baseUrl);
        setSocket(newSocket);

        newSocket.on('receive_message', (message: ChatMessage) => {
            setSessions(prev => prev.map(s => {
                if (s.id === message.chatSessionId) {
                    // Nếu là tin nhắn mới từ khách, kêu ting ting
                    if (message.senderType === 'CUSTOMER') {
                        audioRef.current?.play().catch(() => {});
                    }
                    return { ...s, messages: [...s.messages, message] };
                }
                return s;
            }));
        });

        // Lắng nghe thông báo gọi nhân viên
        newSocket.on('staff_notification', (data: any) => {
            if (data.type === 'CALL_STAFF') {
                audioRef.current?.play().catch(() => {});
                alert(`🚨 CẢNH BÁO: Bàn ${data.tableName} đang gọi nhân viên!`);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedSession?.messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socket || !selectedSessionId || !selectedSession) return;

        const messageData = {
            chatSessionId: selectedSessionId,
            tableId: selectedSession.tableId,
            content: inputValue,
            senderType: 'STAFF',
            senderId: user.id
        };

        socket.emit('send_message', messageData);
        setInputValue('');
    };

    return (
        <div className="flex h-[calc(100vh-200px)] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Sidebar: Danh sách bàn đang chat */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="font-black text-gray-800 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        Hội thoại ({sessions.length})
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm italic">
                            Hiện không có bàn nào đang nhắn tin.
                        </div>
                    ) : (
                        sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`w-full p-6 flex items-center gap-4 border-b border-gray-50 transition-all ${selectedSessionId === session.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : 'hover:bg-gray-50'}`}
                            >
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-blue-600 font-black">
                                    {session.table.name}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-gray-800 text-sm">Bàn {session.table.name}</p>
                                    <p className="text-[11px] text-gray-400 truncate max-w-[140px]">
                                        {session.messages[session.messages.length - 1]?.content || 'Chưa có tin nhắn...'}
                                    </p>
                                </div>
                                {session.messages.some(m => m.senderType === 'CUSTOMER') && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50/30">
                {selectedSession ? (
                    <>
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <h4 className="font-black text-gray-800">Đang chat với Bàn {selectedSession.table.name}</h4>
                            </div>
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                                Trực tuyến
                            </span>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                            {selectedSession.messages.map((msg, idx) => {
                                const isStaff = msg.senderType === 'STAFF';
                                return (
                                    <div key={msg.id || idx} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] text-sm px-6 py-4 rounded-[2rem] font-medium shadow-sm ${isStaff ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                            {msg.content}
                                            <p className={`text-[10px] mt-2 opacity-40 ${isStaff ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Nhập câu trả lời..."
                                className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-sm"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <MessageCircle className="w-20 h-20 opacity-20 mb-4" />
                        <p className="font-bold tracking-widest uppercase text-xs">Hãy chọn một bàn để bắt đầu chat</p>
                    </div>
                )}
            </div>
        </div>
    );
}
