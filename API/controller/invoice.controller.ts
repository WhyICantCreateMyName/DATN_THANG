import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();
const router = Router();

// Lấy danh sách hóa đơn (doanh thu) với bộ lọc
router.get('/invoices', async (req: Request, res: Response) => {
    try {
        const { 
            startDate, 
            endDate, 
            minAmount, 
            maxAmount, 
            customerPhone,
            paymentMethod,
            page = '1',
            limit = '10'
        } = req.query;

        const p = parseInt(page as string);
        const l = parseInt(limit as string);

        const where: any = {
            isPaid: true
        };

        // ... các bộ lọc giữ nguyên ...
        if (startDate || endDate) {
            where.issuedAt = {};
            if (startDate) where.issuedAt.gte = startOfDay(new Date(startDate as string));
            if (endDate) where.issuedAt.lte = endOfDay(new Date(endDate as string));
        }

        if (minAmount || maxAmount) {
            where.finalAmount = {};
            if (minAmount) where.finalAmount.gte = parseFloat(minAmount as string);
            if (maxAmount) where.finalAmount.lte = parseFloat(maxAmount as string);
        }

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        if (customerPhone) {
            where.orders = {
                some: {
                    customerPhone: {
                        contains: customerPhone as string,
                        mode: 'insensitive'
                    }
                }
            };
        }

        const [total, invoices] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.findMany({
                where,
                include: {
                    table: { select: { id: true, name: true } },
                    orders: {
                        select: {
                            id: true,
                            customerPhone: true,
                            createdAt: true,
                            items: {
                                select: {
                                    quantity: true,
                                    menuItem: { select: { name: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { issuedAt: 'desc' },
                skip: (p - 1) * l,
                take: l
            })
        ]);

        // Phẳng hóa dữ liệu để dễ sử dụng ở frontend
        const flattenedInvoices = invoices.map(inv => {
            const firstOrder = inv.orders[0];
            return {
                ...inv,
                customerPhone: firstOrder?.customerPhone || 'Khách lẻ',
                customerName: 'Khách hàng',
                table: {
                    id: inv.table.id,
                    name: inv.table.name
                },
                orderCount: inv.orders.length,
                itemCount: inv.orders.reduce((sum, order) => sum + order.items.length, 0)
            };
        });

        res.status(200).json({
            data: flattenedInvoices,
            meta: {
                total,
                page: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            }
        });
    } catch (error) {
        console.error('Invoice List Error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách hóa đơn' });
    }
});

export default router;
