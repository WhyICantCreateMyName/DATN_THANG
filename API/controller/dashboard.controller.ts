import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const prisma = new PrismaClient();
const router = Router();

router.get('/dashboard/stats', async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        // 1. Doanh thu hôm nay
        const todayInvoices = await prisma.invoice.findMany({
            where: {
                isPaid: true,
                issuedAt: { gte: todayStart, lte: todayEnd }
            },
            select: { finalAmount: true }
        });
        const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

        // 2. Doanh thu 7 ngày gần nhất
        const last7DaysRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const dayInvoices = await prisma.invoice.findMany({
                where: {
                    isPaid: true,
                    issuedAt: { gte: start, lte: end }
                },
                select: { finalAmount: true }
            });
            
            const amount = dayInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
            last7DaysRevenue.push({
                name: format(date, 'dd/MM'),
                amount
            });
        }

        // 3. Món ăn phổ biến (Top 5)
        const popularItemsRaw = await prisma.orderItem.groupBy({
            by: ['menuItemId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const popularItems = await Promise.all(popularItemsRaw.map(async (item) => {
            const menuInfo = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
                select: { name: true }
            });
            return {
                name: menuInfo?.name || 'N/A',
                orders: item._sum.quantity || 0
            };
        }));

        // 4. Cảnh báo kho (Tồn kho < minStock)
        const stockAlerts = await prisma.ingredient.findMany({
            where: {
                currentStock: { lte: prisma.ingredient.fields.minStock as any }
            },
            select: { name: true, currentStock: true, unit: true, minStock: true },
            take: 5
        });

        // 5. Thống kê bàn & nhân viên
        const [totalTables, occupiedTables, totalStaffs, totalOrdersToday] = await Promise.all([
            prisma.table.count(),
            prisma.table.count({ where: { status: 'OCCUPIED' } }),
            prisma.user.count({ where: { role: { in: ['STAFF', 'CHEF'] }, isActive: true } }),
            prisma.order.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } })
        ]);

        res.status(200).json({
            todayRevenue,
            last7DaysRevenue,
            popularItems,
            stockAlerts,
            stats: {
                totalTables,
                occupiedTables,
                fillRate: Math.round((occupiedTables / (totalTables || 1)) * 100),
                totalStaffs,
                totalOrdersToday
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Lỗi lấy dữ liệu dashboard' });
    }
});

export default router;
