import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/categories', async (req: Request, res: Response) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 12;
        if (limit > 50) limit = 50;
        
        const keyword = req.query.keyword as string;
        const where: any = {};
        if (keyword) {
            where.name = { contains: keyword, mode: 'insensitive' };
        }

        const skip = (page - 1) * limit;
        
        const [categories, total] = await Promise.all([
            prisma.category.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.category.count({ where })
        ]);

        res.status(200).json({
            data: categories,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách danh mục' });
    }
});

router.post('/categories', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const newCategory = await prisma.category.create({ data: { name } });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi tạo danh mục' });
    }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const updated = await prisma.category.update({
            where: { id: req.params.id as string },
            data: { name }
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi cập nhật danh mục' });
    }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Lỗi xóa danh mục' });
    }
});

export default router;