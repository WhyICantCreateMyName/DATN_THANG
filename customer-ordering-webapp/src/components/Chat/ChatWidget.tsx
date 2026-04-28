'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, BellRing } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import constants from '@/constants';

interface Message {
  id: string;
  content: string;
  senderType: 'CUSTOMER' | 'STAFF';
  senderId: string;
  createdAt: string;
}

interface ChatWidgetProps {
  tableId: string;
  tableName: string;
  chatSessionId: string;
  initialMessages?: Message[];
}

export default function ChatWidget({ tableId, tableName, chatSessionId, initialMessages = [] }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [guestId, setGuestId] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Persistent Guest ID
    let id = localStorage.getItem('restaurant_guest_id');
    if (!id) {
      id = `guest_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('restaurant_guest_id', id);
    }
    setGuestId(id);

    // Socket.io initialization
    const newSocket = io(constants.url.api.baseUrl);
    setSocket(newSocket);

    newSocket.emit('join_table', tableId);

    newSocket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [tableId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket || !chatSessionId) return;

    const messageData = {
      chatSessionId,
      tableId,
      content: inputValue,
      senderType: 'CUSTOMER',
      senderId: guestId
    };

    socket.emit('send_message', messageData);
    setInputValue('');
  };

  const handleCallStaff = () => {
    if (!socket) return;
    socket.emit('call_staff', { tableId, tableName });
    alert('Đã gửi yêu cầu gọi nhân viên! Vui lòng đợi trong giây lát.');
  };

  return (
    <div className="fixed bottom-24 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[85vw] max-w-[400px] h-[500px] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="p-6 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Hỗ trợ trực tuyến</h3>
                  <p className="text-[10px] opacity-60">Bàn {tableName}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => {
                const isMe = msg.senderId === guestId;
                const isSystem = msg.senderId === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${isMe ? 'bg-amber-500 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="px-6 py-2 bg-white flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-50">
              <button 
                onClick={handleCallStaff}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all"
              >
                <BellRing className="w-3.5 h-3.5" />
                Gọi nhân viên
              </button>
              <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-xs font-bold whitespace-nowrap">
                Hỏi về món ăn
              </button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhắn tin cho quán..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-90 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all relative"
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 border-4 border-gray-50 rounded-full flex items-center justify-center text-[10px] font-bold">
            !
          </span>
        )}
      </button>
    </div>
  );
}
