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
            where: { tableId, isActive: true },
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

export default router;
