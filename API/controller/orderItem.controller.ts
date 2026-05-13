import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Lấy danh sách các món ăn theo trạng thái (Dành cho Bếp)
router.get('/order-items', async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        
        const items = await prisma.orderItem.findMany({
            where: status ? { status: status as any } : {},
            include: {
                menuItem: true,
                order: {
                    include: { table: true }
                }
            },
            orderBy: { order: { createdAt: 'asc' } }
        });
        
        res.status(200).json(items);
    } catch (error) {
        console.error('Fetch Order Items Error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách món ăn' });
    }
});

// Cập nhật trạng thái món ăn (Bếp báo đang nấu/xong món)
router.patch('/order-items/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedItem = await prisma.orderItem.update({
            where: { id: String(id) },
            data: { status },
            include: {
                menuItem: true,
                order: {
                    include: { table: true }
                }
            }
        });

        // Socket: Thông báo cho Thu ngân nếu món đã READY
        if (status === 'READY') {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                const tableId = updatedItem.order.tableId;
                const tableName = updatedItem.order.table.name;
                
                io.emit('staff_notification', {
                    type: 'ITEM_READY',
                    tableId: tableId,
                    tableName: tableName,
                    message: `Món [${updatedItem.menuItem.name}] của bàn ${tableName} đã sẵn sàng!`
                });
                
                // Gửi riêng vào phòng của bàn đó để khách cũng thấy được
                io.to(`table_${tableId}`).emit('item_status_updated', {
                    itemId: updatedItem.id,
                    status: 'READY'
                });
            }
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error('Update Order Item Status Error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái món ăn' });
    }
});

export default router;
