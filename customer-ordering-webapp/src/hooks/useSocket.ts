import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import constants from '@/constants';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);

    useEffect(() => {
        if (!socketInstance) {
            const socketUrl = constants.url.api.production;
            // const socketUrl = constants.url.api.development;
            
            socketInstance = io(socketUrl, {
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
            });

            socketInstance.on('connect', () => {
                console.log('%c📡 [Socket Customer] Connected:', 'color: #00ff00; font-weight: bold;', socketInstance?.id);
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('%c❌ [Socket Customer] Disconnected:', 'color: #ff0000; font-weight: bold;', reason);
            });

            socketInstance.on('reconnect_attempt', () => {
                console.log('🔄 [Socket Customer] Đang thử kết nối lại...');
            });

            setSocket(socketInstance);
        }
        
        if (socket !== socketInstance) {
            setSocket(socketInstance);
        }

        return () => {
            // Giữ kết nối
        };
    }, [socket]);

    return socket;
};
