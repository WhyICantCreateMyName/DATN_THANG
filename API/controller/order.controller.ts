import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Khách hàng tự đặt món qua QR
router.post('/orders', async (req: Request, res: Response) => {
    try {
        const { tableId, items } = req.body;

        if (!tableId || !items || !items.length) {
            return res.status(400).json({ error: 'Dữ liệu đơn hàng không hợp lệ' });
        }

        // 1. Kiểm tra bàn tồn tại
        const table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) return res.status(404).json({ error: 'Không tìm thấy bàn' });

        // 2. Lấy thông tin giá món ăn và tính tổng tiền
        let totalAmount = 0;
        const orderItemsData: any = [];
        const itemDetails: string[] = [];

        for (const item of items) {
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId }
            });

            if (!menuItem) {
                return res.status(404).json({ error: `Không tìm thấy món ăn với ID ${item.menuItemId}` });
            }

            const priceAtTime = menuItem.price;
            totalAmount += priceAtTime * item.quantity;
            itemDetails.push(`${item.quantity} x ${menuItem.name}`);

            orderItemsData.push({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                priceAtTime: priceAtTime,
                notes: item.notes || ''
            });
        }

        // 3. Tìm phiên chat đang hoạt động của bàn
        const activeSession = await prisma.chatSession.findFirst({
            where: { tableId, isActive: true }
        });

        // 4. Tạo Order và OrderItems trong một Transaction
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    tableId,
                    totalAmount,
                    chatSessionId: activeSession?.id || null, // Gắn ID phiên chat
                    status: 'WAITING_APPROVAL',
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: {
                        include: { menuItem: true }
                    },
                    table: true
                }
            });

            return order;
        });

        // 5. Gửi thông báo tự động vào Chat (nếu có phiên chat)
        if (activeSession) {
            const { io } = require('../index'); // Require io từ index để emit

            const systemMsg = await prisma.message.create({
                data: {
                    content: `🔔 Hệ thống: Đơn hàng mới đã được gửi! \n${itemDetails.join('\n')}\n`,
                    senderType: 'STAFF',
                    senderId: 'SYSTEM',
                    chatSessionId: activeSession.id
                }
            });

            // Emit tới room của bàn
            if (io) {
                io.to(`table_${tableId}`).emit('receive_message', systemMsg);
                io.to(`table_${tableId}`).emit('new_order_placed', newOrder);

                // Gửi thông báo TOÀN CỤC tới tất cả nhân viên (Admin/POS)
                io.emit('staff_notification', {
                    type: 'NEW_ORDER',
                    tableId: tableId,
                    tableName: table.name,
                    message: `Bàn ${table.name} vừa đặt món mới!`
                });
            }
        }

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Order Error:', error);
        res.status(500).json({ error: 'Lỗi khi tạo đơn hàng' });
    }
});

// Lấy danh sách đơn hàng (cho POS/Bếp)
router.get('/orders', async (req: Request, res: Response) => {
    try {
        const { status, tableId, onlyActive } = req.query;

        let whereClause: any = {};

        if (status) {
            whereClause.status = status as any;
        }

        if (tableId) {
            // Nếu yêu cầu chỉ lấy đơn đang hoạt động của bàn
            if (onlyActive === 'true') {
                const activeSession = await prisma.chatSession.findFirst({
                    where: { tableId: String(tableId), isActive: true }
                });

                if (!activeSession) {
                    return res.status(200).json([]); // Không có phiên hoạt động = không có đơn mới
                }

                whereClause.chatSessionId = activeSession.id;
            } else {
                whereClause.tableId = String(tableId);
            }
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: { include: { menuItem: true } },
                table: true,
                waiter: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách đơn hàng' });
    }
});

// Cập nhật trạng thái đơn hàng (Duyệt/Hủy/Hoàn thành)
router.patch('/orders/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id: String(id) },
                data: { status },
                include: { table: true }
            });

            // Nếu đơn hàng được duyệt (PENDING), chuyển trạng thái bàn sang OCCUPIED
            if (status === 'PENDING') {
                await tx.table.update({
                    where: { id: order.tableId },
                    data: { status: 'OCCUPIED' }
                });
            }

            return order;
        });

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái đơn hàng' });
    }
});

// Di chuyển Đơn hàng sang bàn khác (Hỗ trợ Gộp/Tách đơn)
router.post('/orders/move', async (req: Request, res: Response) => {
    try {
        const { orderId, targetTableId } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Tìm phiên chat đang hoạt động của bàn đích
            let targetSession = await tx.chatSession.findFirst({
                where: { tableId: targetTableId, isActive: true }
            });

            // Nếu bàn đích trống, tự động tạo phiên mới và chuyển trạng thái bàn sang OCCUPIED
            if (!targetSession) {
                targetSession = await tx.chatSession.create({
                    data: { tableId: targetTableId, isActive: true }
                });
                await tx.table.update({
                    where: { id: targetTableId },
                    data: { status: 'OCCUPIED' }
                });
            }

            // 2. Chuyển Đơn hàng sang phiên mới và bàn mới
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    tableId: targetTableId,
                    chatSessionId: targetSession.id
                }
            });

            return updatedOrder;
        });

        const { io } = require('../index');
        if (io) io.emit('staff_notification', { type: 'TABLE_UPDATED' });

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Lỗi khi di chuyển đơn hàng' });
    }
});

export default router;
