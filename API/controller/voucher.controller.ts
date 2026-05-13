import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// --- ADMIN ENDPOINTS ---

// Lấy danh sách voucher (Admin)
router.get('/vouchers', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const keyword = req.query.keyword as string;
        const where: any = {};
        if (keyword) {
            where.OR = [
                { code: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } }
            ];
        }
        const skip = (page - 1) * limit;

        const [vouchers, total] = await Promise.all([
            prisma.voucher.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.voucher.count({ where })
        ]);

        res.status(200).json({
            data: vouchers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách voucher' });
    }
});

// Tạo voucher mới
router.post('/vouchers', async (req: Request, res: Response) => {
    try {
        const {
            code, description, discountType, discountValue,
            maxDiscount, minOrderValue, usageLimit, maxUsagePerCustomer,
            isActive, startDate, endDate, conditions
        } = req.body;

        const voucher = await prisma.voucher.create({
            data: {
                code: code.toUpperCase(),
                description,
                discountType,
                discountValue: parseFloat(discountValue),
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                minOrderValue: parseFloat(minOrderValue) || 0,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                maxUsagePerCustomer: maxUsagePerCustomer ? parseInt(maxUsagePerCustomer) : null,
                isActive: isActive ?? true,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                conditions: conditions || []
            }
        });
        res.status(201).json(voucher);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Mã voucher đã tồn tại' });
        }
        res.status(500).json({ error: 'Lỗi tạo voucher' });
    }
});

// Cập nhật voucher
router.put('/vouchers/:id', async (req: Request, res: Response) => {
    try {
        const {
            description, discountType, discountValue,
            maxDiscount, minOrderValue, usageLimit,
            isActive, startDate, endDate, conditions, maxUsagePerCustomer
        } = req.body;

        const updateData: any = {};

        if (description !== undefined) updateData.description = description;
        if (discountType !== undefined) updateData.discountType = discountType;
        if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
        if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
        if (minOrderValue !== undefined) updateData.minOrderValue = parseFloat(minOrderValue);
        if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
        if (maxUsagePerCustomer !== undefined) updateData.maxUsagePerCustomer = maxUsagePerCustomer ? parseInt(maxUsagePerCustomer) : null;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (conditions !== undefined) updateData.conditions = conditions;

        const voucher = await prisma.voucher.update({
            where: { id: String(req.params.id) },
            data: updateData
        });
        res.status(200).json(voucher);
    } catch (error: any) {
        console.error('Lỗi cập nhật voucher:', error);
        res.status(500).json({ error: 'Lỗi cập nhật voucher: ' + error.message });
    }
});

// Xóa voucher
router.delete('/vouchers/:id', async (req: Request, res: Response) => {
    try {
        await prisma.voucher.delete({ where: { id: String(req.params.id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa voucher' });
    }
});

// --- CUSTOMER ENDPOINTS ---

// Lấy danh sách voucher đang hoạt động (Khách)
router.get('/vouchers/active', async (req: Request, res: Response) => {
    try {
        const { phone } = req.query;
        const now = new Date();
        const vouchers = await prisma.voucher.findMany({
            where: {
                isActive: true,
                OR: [
                    { startDate: null },
                    { startDate: { lte: now } }
                ],
                AND: [
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // Lọc và gắn thêm trạng thái giới hạn theo khách
        const enrichedVouchers = await Promise.all(vouchers.map(async (v: any) => {
            const isTotalLimitReached = v.usageLimit && v.usedCount >= v.usageLimit;
            let isReachedCustomerLimit = false;

            if (phone && v.maxUsagePerCustomer) {
                const usedCount = await prisma.order.count({
                    where: {
                        customerPhone: String(phone),
                        voucherCode: v.code,
                        status: { not: 'CANCELLED' }
                    }
                });
                isReachedCustomerLimit = usedCount >= v.maxUsagePerCustomer;
            }

            return {
                ...v,
                isTotalLimitReached,
                isReachedCustomerLimit
            };
        }));

        // Chỉ trả về những voucher chưa hết giới hạn TỔNG
        const finalVouchers = enrichedVouchers.filter(v => !v.isTotalLimitReached);

        res.status(200).json(finalVouchers);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách khuyến mãi' });
    }
});

// Kiểm tra voucher có hợp lệ không
router.post('/vouchers/validate', async (req: Request, res: Response) => {
    try {
        const { code, orderValue, customerInfo } = req.body;

        const voucher = await prisma.voucher.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!voucher) return res.status(404).json({ error: 'Voucher không tồn tại' });
        if (!voucher.isActive) return res.status(400).json({ error: 'Voucher đã bị vô hiệu hóa' });

        const now = new Date();
        if (voucher.startDate && now < voucher.startDate) return res.status(400).json({ error: 'Voucher chưa đến thời gian áp dụng' });
        if (voucher.endDate && now > voucher.endDate) return res.status(400).json({ error: 'Voucher đã hết hạn' });

        if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
            return res.status(400).json({ error: 'Voucher đã hết lượt sử dụng' });
        }

        if (orderValue < voucher.minOrderValue) {
            return res.status(400).json({ error: `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ` });
        }

        // Kiểm tra giới hạn sử dụng của từng khách hàng
        if (voucher.maxUsagePerCustomer && customerInfo?.phone) {
            const customerUsedCount = await prisma.order.count({
                where: {
                    customerPhone: customerInfo.phone,
                    voucherCode: voucher.code,
                    status: { not: 'CANCELLED' } // Không tính các đơn đã hủy
                }
            });

            if (customerUsedCount >= voucher.maxUsagePerCustomer) {
                return res.status(400).json({ error: `Bạn đã hết lượt sử dụng voucher này (Giới hạn: ${voucher.maxUsagePerCustomer} lần)` });
            }
        }

        // Logic kiểm tra ĐIỀU KIỆN TÙY BIẾN (JSON)
        const conditions = voucher.conditions as any[];
        if (conditions && conditions.length > 0) {
            for (const cond of conditions) {
                // Ví dụ điều kiện: { type: 'NEW_USER' }
                if (cond.type === 'NEW_USER') {
                    // Cần phone của khách để kiểm tra lịch sử
                    if (!customerInfo?.phone) return res.status(400).json({ error: 'Voucher này chỉ dành cho khách hàng mới' });

                    const previousInvoices = await prisma.reservation.count({
                        where: { customerPhone: customerInfo.phone, status: 'COMPLETED' }
                    });

                    if (previousInvoices > 0) return res.status(400).json({ error: 'Voucher này chỉ dành cho khách hàng mới' });
                }

                // Ví dụ điều kiện: { type: 'MIN_ORDERS', value: 5 }
                if (cond.type === 'MIN_ORDERS') {
                    if (!customerInfo?.phone) return res.status(400).json({ error: 'Bạn cần nhập số điện thoại để áp dụng voucher này' });

                    const orderCount = await prisma.reservation.count({
                        where: { customerPhone: customerInfo.phone, status: 'COMPLETED' }
                    });

                    if (orderCount < cond.value) {
                        return res.status(400).json({ error: `Bạn cần hoàn thành ít nhất ${cond.value} đơn hàng để dùng voucher này` });
                    }
                }
            }
        }

        // Tính toán số tiền giảm
        let discountAmount = 0;
        if (voucher.discountType === 'FIXED') {
            discountAmount = voucher.discountValue;
        } else {
            discountAmount = (orderValue * voucher.discountValue) / 100;
            if (voucher.maxDiscount) {
                discountAmount = Math.min(discountAmount, voucher.maxDiscount);
            }
        }

        res.status(200).json({
            valid: true,
            voucherId: voucher.id,
            discountAmount,
            message: 'Áp dụng voucher thành công!'
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi kiểm tra voucher' });
    }
});

export default router;
