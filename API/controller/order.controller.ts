import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * HÀM HELPER: Tự động trừ kho dựa trên định mức nguyên liệu (Recipe)
 * Gọi khi đơn hàng được phục vụ (SERVED)
 */
async function deductStockForOrder(orderId: string, userId: string | null, tx: any) {
    try {
        // 1. Lấy thông tin đơn hàng để lấy waiterId nếu có
        const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { waiterId: true }
        });

        // 2. Tìm một User ID hợp lệ làm fallback (ví dụ Admin đầu tiên)
        let finalUserId = userId || order?.waiterId;
        
        if (!finalUserId) {
            const firstAdmin = await tx.user.findFirst({
                where: { role: 'ADMIN' },
                select: { id: true }
            });
            finalUserId = firstAdmin?.id;
        }

        // Nếu vẫn không tìm thấy User nào (trường hợp DB trống user), đành log lỗi và thoát
        if (!finalUserId) {
            console.error('Không tìm thấy User ID hợp lệ để thực hiện trừ kho');
            return;
        }

        // 3. Lấy toàn bộ món ăn trong đơn hàng kèm công thức
        const orderItems = await tx.orderItem.findMany({
            where: { orderId },
            include: {
                menuItem: {
                    include: {
                        ingredients: {
                            include: { ingredient: true }
                        }
                    }
                }
            }
        });

        for (const item of orderItems) {
            if (!item.menuItem.ingredients || item.menuItem.ingredients.length === 0) continue;

            for (const recipeItem of item.menuItem.ingredients) {
                const totalDeduct = item.quantity * recipeItem.quantity;

                // 4. Tạo bản ghi giao dịch kho (EXPORT)
                await tx.stockTransaction.create({
                    data: {
                        ingredientId: recipeItem.ingredientId,
                        type: 'EXPORT',
                        quantity: totalDeduct,
                        note: `Khấu hao tự động: Đơn hàng #${orderId.slice(-4)} - Món: ${item.menuItem.name}`,
                        userId: finalUserId
                    }
                });

                // 5. Cập nhật tồn kho thực tế
                await tx.ingredient.update({
                    where: { id: recipeItem.ingredientId },
                    data: {
                        currentStock: {
                            decrement: totalDeduct
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Lỗi khi khấu hao kho tự động:', error);
        // Ném lỗi ra để Transaction cha biết mà Rollback nếu cần, 
        // hoặc bắt lại nếu muốn tiếp tục nhưng ở đây nên để nó báo lỗi rõ ràng.
        throw error; 
    }
}


// Khách hàng tự đặt món qua QR
router.post('/orders', async (req: Request, res: Response) => {
    try {
        const { tableId, items, voucherCode, customerPhone } = req.body;

        if (!tableId || !items || !items.length) {
            return res.status(400).json({ error: 'Dữ liệu đơn hàng không hợp lệ' });
        }

        // 1. Kiểm tra bàn tồn tại
        const table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) return res.status(404).json({ error: 'Không tìm thấy bàn' });

        // 2. Lấy thông tin giá món ăn và tính tổng tiền tạm tính
        let subTotal = 0;
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
            subTotal += priceAtTime * item.quantity;
            itemDetails.push(`${item.quantity} x ${menuItem.name}`);

            orderItemsData.push({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                priceAtTime: priceAtTime,
                notes: item.notes || '',
                status: 'PENDING'
            });
        }

        // 3. Xử lý Voucher (Xác thực lại ở Backend)
        let discountAmount = 0;
        let validatedVoucher: any = null;

        if (voucherCode) {
            validatedVoucher = await prisma.voucher.findUnique({
                where: { code: voucherCode.toUpperCase() }
            });

            if (validatedVoucher && validatedVoucher.isActive) {
                // Kiểm tra điều kiện cơ bản
                const now = new Date();
                const isTimed = (!validatedVoucher.startDate || now >= validatedVoucher.startDate) &&
                                (!validatedVoucher.endDate || now <= validatedVoucher.endDate);
                const isUnderLimit = !validatedVoucher.usageLimit || validatedVoucher.usedCount < validatedVoucher.usageLimit;
                const isMinOrderMet = subTotal >= validatedVoucher.minOrderValue;

                // Kiểm tra giới hạn dùng mỗi khách
                let isCustomerLimitMet = true;
                if (validatedVoucher.maxUsagePerCustomer && customerPhone) {
                    const usedCount = await prisma.order.count({
                        where: {
                            customerPhone,
                            voucherCode: validatedVoucher.code,
                            status: { not: 'CANCELLED' }
                        }
                    });
                    if (usedCount >= validatedVoucher.maxUsagePerCustomer) {
                        isCustomerLimitMet = false;
                    }
                }

                if (isTimed && isUnderLimit && isMinOrderMet && isCustomerLimitMet) {
                    // Tính số tiền giảm
                    if (validatedVoucher.discountType === 'FIXED') {
                        discountAmount = validatedVoucher.discountValue;
                    } else {
                        discountAmount = (subTotal * validatedVoucher.discountValue) / 100;
                        if (validatedVoucher.maxDiscount) {
                            discountAmount = Math.min(discountAmount, validatedVoucher.maxDiscount);
                        }
                    }
                }
            }
        }

        // 4. Tìm phiên chat đang hoạt động của bàn
        const activeSession = await prisma.chatSession.findFirst({
            where: { tableId, isActive: true }
        });

        // 5. Tạo Order và OrderItems trong một Transaction
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    tableId,
                    customerPhone,
                    totalAmount: subTotal,
                    discountAmount,
                    voucherCode: validatedVoucher ? validatedVoucher.code : null,
                    chatSessionId: activeSession?.id || null,
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

            // Cập nhật lượt dùng voucher nếu có áp dụng thành công
            if (validatedVoucher && discountAmount > 0) {
                await tx.voucher.update({
                    where: { id: validatedVoucher.id },
                    data: { usedCount: { increment: 1 } }
                });
            }

            return order;
        });

        // 5. Gửi thông báo tự động vào Chat (nếu có phiên chat)
        if (activeSession) {
            const { getIO } = require('../socket'); 
            const io = getIO();

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
            if (Array.isArray(status)) {
                whereClause.status = { in: status as any[] };
            } else {
                whereClause.status = status as any;
            }
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
                whereClause.status = { notIn: ['COMPLETED', 'CANCELLED'] };
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
            // Cập nhật trạng thái Đơn hàng
            const order = await tx.order.update({
                where: { id: String(id) },
                data: { status },
                include: { table: true }
            });

            // Đồng bộ trạng thái của các món ăn trong đơn (OrderItem)
            // Nếu đơn ở trạng thái COOKING, READY, SERVED thì các món cũng vậy
            if (['COOKING', 'READY', 'SERVED'].includes(status)) {
                await tx.orderItem.updateMany({
                    where: { orderId: String(id) },
                    data: { status: status as any }
                });
            }

            // Nếu Duyệt (COOKING/PENDING), chuyển trạng thái bàn sang OCCUPIED
            if (status === 'COOKING' || status === 'PENDING') {
                await tx.table.update({
                    where: { id: order.tableId },
                    data: { status: 'OCCUPIED' }
                });
            }

            // --- TASK 3: TỰ ĐỘNG KHẤU HAO KHO ---
            // Nếu đơn hàng chuyển sang trạng thái SERVED (Đã phục vụ), thực hiện trừ kho
            if (status === 'SERVED') {
                const userId = req.body.userId || null;
                await deductStockForOrder(String(id), userId, tx);
            }

            return order;
        });

        res.status(200).json(updatedOrder);

        // Phát tín hiệu Socket
        const { getIO } = require('../socket');
        const io = getIO();
        if (io) {
            // Gửi cho khách hàng tại bàn đó
            io.to(`table_${updatedOrder.tableId}`).emit('ORDER_STATUS_UPDATED', {
                orderId: updatedOrder.id,
                status: updatedOrder.status,
                message: `Đơn hàng #${updatedOrder.id.slice(-4)} đã chuyển sang: ${updatedOrder.status}`
            });

            // Gửi cho toàn bộ nhân viên cập nhật UI
            io.emit('staff_notification', {
                type: 'ORDER_UPDATED',
                tableId: updatedOrder.tableId,
                status: updatedOrder.status
            });
        }
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

        const { getIO } = require('../socket');
        const io = getIO();
        if (io) io.emit('staff_notification', { type: 'TABLE_UPDATED' });

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Lỗi khi di chuyển đơn hàng' });
    }
});

export default router;
