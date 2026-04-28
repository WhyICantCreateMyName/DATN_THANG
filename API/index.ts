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
import orderItemRoutes from './controller/orderItem.controller';
import ingredientRoutes from './controller/ingredient.controller';
import recipeRoutes from './controller/recipe.controller';
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
app.use('/', orderItemRoutes);
app.use('/', ingredientRoutes);
app.use('/', recipeRoutes);

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

    socket.on('join_staff_room', () => {
        socket.join('staff_room');
        console.log(`👨‍💼 Nhân viên ${socket.id} đã vào phòng điều hành`);
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

            if (data.senderType === 'CUSTOMER') {
                // Khách nhắn: Chỉ gửi lại cho chính người gửi và toàn bộ nhân viên
                socket.emit('receive_message', newMessage);
                io.to('staff_room').emit('receive_message', newMessage);
                
                io.emit('staff_notification', {
                    type: 'NEW_MESSAGE',
                    tableId: data.tableId,
                    message: `Bàn ${data.tableId} vừa gửi tin nhắn mới!`
                });
            } else {
                // Nhân viên nhắn: Gửi cho cả bàn (Khách sẽ tự lọc ở FE dựa trên senderId nếu cần, 
                // nhưng STAFF nhắn thì ai ở bàn đó cũng nên thấy)
                io.to(`table_${data.tableId}`).emit('receive_message', newMessage);
                // Đồng thời gửi cho các nhân viên khác để đồng bộ
                io.to('staff_room').emit('receive_message', newMessage);
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn socket:', error);
        }
    });

    socket.on('call_staff', async (data: any) => {
        try {
            const newMessage = await prisma.message.create({
                data: {
                    content: `🔔 Yêu cầu gọi nhân viên`,
                    senderType: 'STAFF', // Coi như hệ thống/nhân viên thông báo
                    senderId: 'SYSTEM',
                    chatSessionId: data.chatSessionId
                }
            });

            // Chỉ gửi lại cho người yêu cầu và nhân viên
            socket.emit('receive_message', newMessage);
            io.to('staff_room').emit('receive_message', newMessage);

            io.emit('staff_notification', {
                type: 'CALL_STAFF',
                tableId: data.tableId,
                tableName: data.tableName,
                message: `Bàn ${data.tableName} đang gọi nhân viên!`
            });
        } catch (error) {
            console.error('Lỗi khi xử lý gọi nhân viên:', error);
        }
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