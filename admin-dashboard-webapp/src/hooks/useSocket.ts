import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '../constants';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);

    useEffect(() => {
        if (!socketInstance) {
            const socketUrl = constants.url.api.production;
            // const socketUrl = constants.url.api.development;

            socketInstance = io(socketUrl, {
                transports: ['websocket'],
                withCredentials: true
            });

            socketInstance.on('connect', () => {
                console.log('📡 Socket connected to server:', socketInstance?.id);
                socketInstance?.emit('join_staff_room');
            });
        }

        if (socket !== socketInstance) {
            setSocket(socketInstance);
        }

        return () => {
            // Giữ kết nối cho staff
        };
    }, [socket]);

    return socket;
};
