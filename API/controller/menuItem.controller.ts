import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/menu-items', async (req: Request, res: Response) => {
    try {
        console.log(`[API] Đang lấy món ăn - Request từ: ${req.ip} - Origin: ${req.headers.origin}`);
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 12;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;
        const categoryId = req.query.categoryId as string;
        const keyword = req.query.keyword as string;

        const where: any = {};
        if (categoryId) where.categoryId = categoryId;
        if (keyword) {
            where.OR = [
                { name: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } }
            ];
        }

        const [items, total] = await Promise.all([
            prisma.menuItem.findMany({
                where,
                skip,
                take: limit,
                include: { category: true },
                orderBy: { name: 'asc' }
            }),
            prisma.menuItem.count({ where })
        ]);

        items.forEach(item => {
            item.imageUrl = `${req.protocol}://${req.headers.host}${item.imageUrl}`;
        });

        res.status(200).json({
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách món ăn' });
    }
});

router.post('/menu-items', async (req: Request, res: Response) => {
    try {
        const { name, description, price, imageUrl, categoryId } = req.body;
        const newItem = await prisma.menuItem.create({
            data: { name, description, price, imageUrl, categoryId }
        });
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi thêm món ăn' });
    }
});

router.put('/menu-items/:id', async (req: Request, res: Response) => {
    try {
        const { name, description, price, imageUrl, isAvailable, categoryId } = req.body;
        const updated = await prisma.menuItem.update({
            where: { id: req.params.id as string },
            data: { name, description, price, imageUrl, isAvailable, categoryId }
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi cập nhật món ăn' });
    }
});

router.delete('/menu-items/:id', async (req: Request, res: Response) => {
    try {
        await prisma.menuItem.delete({ where: { id: req.params.id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Lỗi xóa món ăn' });
    }
});
export default router;