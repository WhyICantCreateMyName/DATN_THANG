import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '../constants';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);

    useEffect(() => {
        if (!socketInstance) {
            const socketUrl = constants.url.api.baseUrl.includes('localhost') 
                ? 'http://localhost:4000' 
                : 'http://192.168.0.102:4000';

            socketInstance = io(socketUrl, {
                transports: ['websocket'],
                withCredentials: true
            });

            socketInstance.on('connect', () => {
                console.log('📡 Socket connected to server:', socketInstance?.id);
                socketInstance?.emit('join_staff_room');
            });
            
            setSocket(socketInstance);
        }

        return () => {
            // Giữ kết nối cho staff
        };
    }, []);

    return socket;
};
