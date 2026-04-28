import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '@/constants';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);

    useEffect(() => {
        if (!socketInstance) {
            socketInstance = io(constants.url.api.baseUrl);
            setSocket(socketInstance);
        }

        return () => {
            // Chúng ta giữ socket sống suốt vòng đời ứng dụng cho khách
        };
    }, []);

    return socket;
};
