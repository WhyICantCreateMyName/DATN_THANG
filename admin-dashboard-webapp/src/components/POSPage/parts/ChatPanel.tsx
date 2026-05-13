'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Clock } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface ChatPanelProps {
    tableId: string;
}

export default function ChatPanel({ tableId }: ChatPanelProps) {
    const { messages, sendMessage, isLoading } = useChat(tableId);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        sendMessage(input, 'STAFF_POS');
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h4 className="font-black text-sm text-gray-900 leading-none">Trò chuyện với khách</h4>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Đang trực tuyến</span>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p className="text-xs font-bold">Chưa có tin nhắn nào</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isStaff = msg.senderType === 'STAFF';
                        const isSystem = msg.senderId === 'SYSTEM';

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-2">
                                    <span className="text-[10px] bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-gray-200 shadow-sm">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={msg.id} 
                                className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`
                                    max-w-[85%] p-3 rounded-2xl text-sm font-medium shadow-sm
                                    ${isStaff 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                                `}>
                                    {msg.content}
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1">
                                    <Clock className="w-3 h-3 text-gray-300" />
                                    <span className="text-[9px] font-bold text-gray-300">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form 
                onSubmit={handleSend}
                className="p-4 border-t border-gray-50 bg-gray-50/30 flex gap-2"
            >
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
