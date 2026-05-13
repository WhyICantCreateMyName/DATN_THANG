import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '../constants';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);

    useEffect(() => {
        if (!socketInstance) {
            const socketUrl = constants.url.api.production;
            socketInstance = io(socketUrl, {
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
            });

            socketInstance.on('connect', () => {
                console.log('%c📡 Socket Connected:', 'color: #00ff00; font-weight: bold;', socketInstance?.id);
                socketInstance?.emit('join_staff_room');
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('%c❌ Socket Disconnected:', 'color: #ff0000; font-weight: bold;', reason);
            });
        }

        setSocket(socketInstance);
    }, []);

    useEffect(() => {
        if (socketInstance && socket !== socketInstance) {
            setSocket(socketInstance);
        }
    }, [socket]);

    return socket;
};
