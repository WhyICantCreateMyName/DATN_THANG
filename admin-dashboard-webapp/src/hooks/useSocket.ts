import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '../constants';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Khởi tạo socket connection đến server (Port 4000)
        // Chúng ta lấy baseUrl từ constants nhưng cần trỏ thẳng tới port của Backend
        const socketUrl = constants.url.api.baseUrl.includes('localhost') 
            ? 'http://localhost:4000' 
            : 'http://192.168.0.102:4000';

        socketRef.current = io(socketUrl, {
            transports: ['websocket'],
            withCredentials: true
        });

        socketRef.current.on('connect', () => {
            console.log('📡 Socket connected to server:', socketRef.current?.id);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return socketRef.current;
};
