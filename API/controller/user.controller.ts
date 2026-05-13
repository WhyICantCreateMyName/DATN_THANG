import type { Request, Response } from 'express';
import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/users', verifyToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 12;
        if (limit > 50) limit = 50;
        
        const keyword = req.query.keyword as string;
        
        const where: any = {};
        if (keyword) {
            where.OR = [
                { fullName: { contains: keyword, mode: 'insensitive' } },
                { username: { contains: keyword, mode: 'insensitive' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.status(200).json({
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách nhân viên' });
    }
});

router.post('/users', verifyToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { username, password, fullName, role } = req.body;
        const newUser = await prisma.user.create({
            data: { username, password, fullName, role }
        });
        res.status(201).json({ message: 'Tạo nhân viên thành công', userId: newUser.id });
    } catch (error) {
        res.status(400).json({ error: 'Lỗi tạo nhân viên' });
    }
});

router.put('/users/:id', verifyToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { fullName, role, isActive } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.params.id as string },
            data: { fullName, role, isActive }
        });
        res.status(200).json({ message: 'Cập nhật thành công', userId: updated.id });
    } catch (error) {
        res.status(400).json({ error: 'Lỗi cập nhật nhân viên' });
    }
});

router.delete('/users/:id', verifyToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Lỗi xóa nhân viên' });
    }
});
export default router;