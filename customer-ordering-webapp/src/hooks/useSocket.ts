import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '@/constants';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);

    useEffect(() => {
        if (!socketInstance) {
            const socketUrl = process.env.NODE_ENV === 'development' ? constants.url.api.development : constants.url.api.production;
            socketInstance = io(socketUrl, {
                transports: ['websocket'],
                withCredentials: true
            });
            setSocket(socketInstance);
        }

        return () => {
            // Chúng ta giữ socket sống suốt vòng đời ứng dụng cho khách
        };
    }, []);

    return socket;
};
