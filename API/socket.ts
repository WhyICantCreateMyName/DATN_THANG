import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "https://admin.thanhcanghaiphong.online", 
                "https://www.thanhcanghaiphong.online", 
                "https://thanhcanghaiphong.online"
            ],
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    return io;
};

export const getIO = () => {
    if (!io) {
        // Fallback or log error
        console.warn('Socket.io not initialized');
    }
    return io;
};
