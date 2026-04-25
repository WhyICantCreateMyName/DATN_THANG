import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './controller/auth.controller';
import categoryRoutes from './controller/category.controller';
import menuItemRoutes from './controller/menuItem.controller';
import tableRoutes from './controller/table.controller';
import userRoutes from './controller/user.controller';
import uploadRoutes from './controller/upload.controller';
import orderRoutes from './controller/order.controller';
import chatRoutes from './controller/chat.controller';
import { initMinio } from './utils/minio';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true
    }
});
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 4000;

// Initialize MinIO Bucket and Policy
initMinio();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/', authRoutes);
app.use('/', categoryRoutes);
app.use('/', menuItemRoutes);
app.use('/', tableRoutes);
app.use('/', userRoutes);
app.use('/', uploadRoutes);
app.use('/', orderRoutes);
app.use('/', chatRoutes);

// ==========================================
// SOCKET.IO LOGIC
// ==========================================
io.on('connection', (socket) => {
    console.log('🔌 Một kết nối mới:', socket.id);

    socket.on('join_table', (tableId: string) => {
        socket.join(`table_${tableId}`);
        console.log(`📍 Socket ${socket.id} đã vào phòng: table_${tableId}`);
    });

    socket.on('leave_table', (tableId: string) => {
        socket.leave(`table_${tableId}`);
    });

    socket.on('send_message', async (data: any) => {
        try {
            const newMessage = await prisma.message.create({
                data: {
                    content: data.content,
                    senderType: data.senderType,
                    senderId: data.senderId,
                    chatSessionId: data.chatSessionId
                }
            });
            io.to(`table_${data.tableId}`).emit('receive_message', newMessage);
        } catch (error) {
            console.error('Lỗi gửi tin nhắn socket:', error);
        }
    });

    socket.on('call_staff', (data: any) => {
        io.emit('staff_notification', {
            type: 'CALL_STAFF',
            tableId: data.tableId,
            tableName: data.tableName,
            message: `Bàn ${data.tableName} đang gọi nhân viên!`
        });
    });

    socket.on('update_cart', (data: any) => {
        socket.to(`table_${data.tableId}`).emit('cart_updated', data.cart);
    });

    socket.on('disconnect', () => {
        console.log('❌ Một kết nối đã ngắt:', socket.id);
    });
});

export { io };

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'OK', message: 'Hệ thống đang chạy, Database đã kết nối!' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: 'Lỗi kết nối Database' });
    }
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server (Socket.io + Express) đang chạy tại:`);
    console.log(`   - Network: http://192.168.0.102:${PORT}`);
});