import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Lấy danh sách tin nhắn của phiên đang hoạt động của một bàn
router.get('/chat/:tableId/messages', async (req: Request, res: Response) => {
    try {
        const { tableId } = req.params;
        const activeSession = await prisma.chatSession.findFirst({
            where: { tableId: String(tableId), isActive: true },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        
        if (!activeSession) {
            return res.status(200).json({ data: [] });
        }
        
        res.status(200).json({ 
            data: activeSession.messages,
            sessionId: activeSession.id 
        });
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        res.status(500).json({ error: 'Lỗi lấy tin nhắn' });
    }
});

// Gửi tin nhắn mới qua REST API (Thay thế cho socket.emit)
router.post('/chat/messages', async (req: Request, res: Response) => {
    try {
        const { tableId, chatSessionId, content, senderType, senderId } = req.body;

        if (!tableId || !chatSessionId || !content) {
            return res.status(400).json({ error: 'Thiếu thông tin tin nhắn' });
        }

        // 1. Lưu tin nhắn vào DB
        const newMessage = await prisma.message.create({
            data: {
                content,
                senderType,
                senderId: senderId || 'UNKNOWN',
                chatSessionId
            }
        });

        // 2. Phát tín hiệu qua Socket từ phía Server
        const { getIO } = require('../socket');
        const io = getIO();
        
        if (io) {
            // Khách nhắn: Phát lại cho bàn và toàn bộ nhân viên
            if (senderType === 'CUSTOMER') {
                io.to(`table_${tableId}`).emit('receive_message', newMessage);
                io.to('staff_room').emit('receive_message', newMessage);

                try {
                    const table = await prisma.table.findUnique({
                        where: { id: tableId }
                    });

                    io.emit('staff_notification', {
                        type: 'NEW_MESSAGE',
                        tableId: tableId,
                        tableName: table?.name || tableId,
                        message: `Bàn ${table?.name || 'số...'} vừa gửi tin nhắn mới!`
                    });
                } catch (err) {
                    // Fallback
                    io.emit('staff_notification', {
                        type: 'NEW_MESSAGE',
                        tableId: tableId,
                        message: `Có tin nhắn mới từ bàn ${tableId}`
                    });
                }
            } else {
                // Nhân viên nhắn: Phát lại cho bàn đó và đồng bộ cho các nhân viên khác
                io.to(`table_${tableId}`).emit('receive_message', newMessage);
                io.to('staff_room').emit('receive_message', newMessage);
            }
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ error: 'Lỗi gửi tin nhắn' });
    }
});

export default router;
