import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/tables', async (req: Request, res: Response) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 12;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        const [tables, total] = await Promise.all([
            prisma.table.findMany({ skip, take: limit }),
            prisma.table.count()
        ]);

        res.status(200).json({
            data: tables,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách bàn' });
    }
});

router.get('/tables/qrcode/:qrCode', async (req: Request, res: Response) => {
    try {
        const { qrCode } = req.params;
        const { guestId } = req.query; // Nhận guestId từ client

        const table = await prisma.table.findUnique({
            where: { qrCode: qrCode as string }
        });

        if (!table) {
            return res.status(404).json({ error: 'Không tìm thấy bàn với mã QR này' });
        }

        // Tìm hoặc tạo Phiên Chat đang hoạt động cho bàn này
        let activeSession = await prisma.chatSession.findFirst({
            where: {
                tableId: table.id,
                isActive: true
            },
            include: {
                messages: {
                    where: {
                        OR: [
                            { senderId: String(guestId) },
                            { senderType: 'STAFF' }
                        ]
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!activeSession) {
            activeSession = await prisma.chatSession.create({
                data: {
                    tableId: table.id,
                    isActive: true
                },
                include: {
                    messages: true // Phiên mới thì chưa có tin nhắn nên không cần lọc phức tạp
                }
            });
        }

        // Lấy danh sách các đơn hàng đã đặt trong phiên này
        const orders = await prisma.order.findMany({
            where: {
                tableId: table.id,
                createdAt: { gte: activeSession.startTime }
            },
            include: {
                items: { include: { menuItem: true } }
            }
        });

        res.status(200).json({
            data: {
                table,
                chatSession: activeSession,
                orders: orders
            }
        });
    } catch (error) {
        console.error('QR Verification Error:', error);
        res.status(500).json({ error: 'Lỗi khi tìm bàn bằng mã QR' });
    }
});


router.post('/tables', async (req: Request, res: Response) => {
    try {
        const { name, capacity, qrCode } = req.body;
        const newTable = await prisma.table.create({
            data: { name, capacity, qrCode }
        });
        res.status(201).json(newTable);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi tạo bàn' });
    }
});

router.put('/tables/:id', async (req: Request, res: Response) => {
    try {
        const { name, capacity, status, qrCode } = req.body;
        const updated = await prisma.table.update({
            where: { id: req.params.id as string },
            data: { name, capacity, status, qrCode }
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi cập nhật bàn' });
    }
});

router.delete('/tables/:id', async (req: Request, res: Response) => {
    try {
        await prisma.table.delete({ where: { id: req.params.id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Lỗi xóa bàn' });
    }
});

// Thanh toán và kết thúc phiên (Giải phóng bàn)
router.post('/tables/:id/checkout', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { orderIds } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            const activeSession = await tx.chatSession.findFirst({
                where: { tableId: String(id), isActive: true },
                include: { orders: true }
            });

            if (!activeSession) {
                throw new Error('Không tìm thấy phiên hoạt động cho bàn này');
            }

            let ordersToPay = activeSession.orders.filter(o => 
                ['PENDING', 'COOKING', 'READY', 'SERVED', 'WAITING_APPROVAL'].includes(o.status)
            );

            const { paymentMethod = 'CASH', orderIds } = req.body;
            const isEWallet = paymentMethod === 'E_WALLET' || paymentMethod === 'TRANSFER';

            if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
                ordersToPay = ordersToPay.filter(o => orderIds.includes(o.id));
            }

            let totalAmount = 0;
            let invoiceId = null;

            if (ordersToPay.length > 0) {
                totalAmount = ordersToPay.reduce((sum, o) => sum + o.totalAmount, 0);

                const invoice = await tx.invoice.create({
                    data: {
                        subTotal: totalAmount,
                        finalAmount: totalAmount,
                        tableId: String(id),
                        chatSessionId: activeSession.id,
                        isPaid: !isEWallet, // Nếu là điện tử thì chưa trả
                        paymentMethod: paymentMethod as any,
                        orders: {
                            connect: ordersToPay.map(o => ({ id: o.id }))
                        }
                    }
                });
                invoiceId = invoice.id;

                // Nếu đã trả (Tiền mặt) thì hoàn thành đơn luôn
                if (!isEWallet) {
                    await tx.payment.create({
                        data: {
                            amount: totalAmount,
                            method: paymentMethod as any,
                            invoiceId: invoice.id
                        }
                    });

                    await tx.order.updateMany({
                        where: { id: { in: ordersToPay.map(o => o.id) } },
                        data: { status: 'COMPLETED' }
                    });
                }
            }

            // Chỉ giải phóng bàn nếu đã thanh toán hết (isPaid = true)
            let isFullyPaid = false;
            if (!isEWallet) {
                const remaining = await tx.order.count({
                    where: {
                        chatSessionId: activeSession.id,
                        status: { in: ['PENDING', 'COOKING', 'READY', 'SERVED', 'WAITING_APPROVAL'] }
                    }
                });
                isFullyPaid = remaining === 0;

                if (isFullyPaid) {
                    await tx.chatSession.update({
                        where: { id: activeSession.id },
                        data: { isActive: false, endTime: new Date() }
                    });
                    await tx.table.update({
                        where: { id: String(id) },
                        data: { status: 'AVAILABLE' }
                    });
                }
            }

            return { 
                message: isFullyPaid ? 'Bàn đã được đóng' : (isEWallet ? 'Yêu cầu thanh toán điện tử đã được tạo' : 'Thanh toán một phần thành công'), 
                invoiceId, 
                total: totalAmount,
                isFullyPaid,
                paymentMethod
            };
        });

        res.status(200).json(result);

        const { getIO } = require('../socket');
        const io = getIO();
        if (io) {
            if (result.isFullyPaid) {
                io.to(`table_${id}`).emit('SESSION_ENDED');
            }
            io.emit('staff_notification', { type: 'TABLE_UPDATED' });
        }
    } catch (error: any) {
        console.error('Checkout Error:', error);
        res.status(500).json({ error: error.message || 'Lỗi khi thực hiện thanh toán' });
    }
});

// Gộp bàn (Chuyển toàn bộ đơn hàng từ bàn A sang bàn B)
router.post('/tables/merge', async (req: Request, res: Response) => {
    try {
        const { sourceTableId, targetTableId } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Tìm phiên hoạt động của bàn nguồn
            const sourceSession = await tx.chatSession.findFirst({
                where: { tableId: sourceTableId, isActive: true }
            });

            if (!sourceSession) throw new Error('Bàn nguồn không có phiên hoạt động');

            // 2. Tìm hoặc tạo phiên hoạt động cho bàn đích
            let targetSession = await tx.chatSession.findFirst({
                where: { tableId: targetTableId, isActive: true }
            });

            if (!targetSession) {
                targetSession = await tx.chatSession.create({
                    data: { tableId: targetTableId, isActive: true }
                });
                await tx.table.update({
                    where: { id: targetTableId },
                    data: { status: 'OCCUPIED' }
                });
            }

            // 3. Di chuyển toàn bộ Order sang bàn đích và phiên đích
            await tx.order.updateMany({
                where: { chatSessionId: sourceSession.id },
                data: {
                    tableId: targetTableId,
                    chatSessionId: targetSession.id
                }
            });

            // 4. Đóng phiên bàn nguồn
            await tx.chatSession.update({
                where: { id: sourceSession.id },
                data: { isActive: false, endTime: new Date() }
            });

            // 5. Giải phóng bàn nguồn
            await tx.table.update({
                where: { id: sourceTableId },
                data: { status: 'AVAILABLE' }
            });

            return { message: 'Gộp bàn thành công', targetTableId };
        });

        const { getIO } = require('../socket');
        const io = getIO();
        if (io) io.emit('staff_notification', { type: 'TABLE_UPDATED' });

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Lỗi khi gộp bàn' });
    }
});

export default router;