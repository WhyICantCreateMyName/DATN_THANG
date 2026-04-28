import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// --- INGREDIENTS ---

// Lấy danh sách nguyên liệu (Có phân trang)
router.get('/ingredients', async (req: Request, res: Response) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [ingredients, total] = await Promise.all([
            prisma.ingredient.findMany({
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.ingredient.count()
        ]);

        res.status(200).json({
            data: ingredients,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách nguyên liệu' });
    }
});

// Tạo nguyên liệu mới
router.post('/ingredients', async (req: Request, res: Response) => {
    try {
        const { name, unit, minStock } = req.body;
        const newIngredient = await prisma.ingredient.create({
            data: { name, unit, minStock: parseFloat(minStock) }
        });
        res.status(201).json(newIngredient);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi tạo nguyên liệu' });
    }
});

// Cập nhật nguyên liệu
router.put('/ingredients/:id', async (req: Request, res: Response) => {
    try {
        const { name, unit, minStock } = req.body;
        const updated = await prisma.ingredient.update({
            where: { id: String(req.params.id) },
            data: { name, unit, minStock: parseFloat(minStock) }
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi cập nhật nguyên liệu' });
    }
});

// Xoá nguyên liệu
router.delete('/ingredients/:id', async (req: Request, res: Response) => {
    try {
        await prisma.ingredient.delete({
            where: { id: String(req.params.id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Lỗi xoá nguyên liệu' });
    }
});

// --- STOCK TRANSACTIONS ---

// Thực hiện giao dịch kho (NHẬP/XUẤT/KIỂM KÊ)
router.post('/ingredients/transaction', async (req: Request, res: Response) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const { ingredientId, type, quantity, note, userId, supplierId } = req.body;

            // 1. Tạo bản ghi giao dịch
            const transaction = await tx.stockTransaction.create({
                data: {
                    ingredientId,
                    type,
                    quantity: parseFloat(quantity),
                    note,
                    userId,
                    supplierId: supplierId || null
                }
            });

            // 2. Cập nhật tồn kho thực tế
            let adjustment = parseFloat(quantity);
            const currentIngredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
            
            if (!currentIngredient) throw new Error('Nguyên liệu không tồn tại');

            if (type === 'EXPORT') {
                adjustment = -adjustment;
            } else if (type === 'AUDIT_START' || type === 'AUDIT_END') {
                adjustment = parseFloat(quantity) - currentIngredient.currentStock;
            }

            const updatedIngredient = await tx.ingredient.update({
                where: { id: ingredientId },
                data: {
                    currentStock: {
                        increment: adjustment
                    }
                }
            });

            return { transaction, updatedIngredient };
        });

        res.status(200).json(result);
    } catch (error: any) {
        console.error('Stock Transaction Error:', error);
        res.status(400).json({ error: error.message || 'Lỗi thực hiện giao dịch kho' });
    }
});

// Lấy lịch sử giao dịch (Có phân trang)
router.get('/ingredients/transactions', async (req: Request, res: Response) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 15;
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.stockTransaction.findMany({
                skip,
                take: limit,
                include: {
                    ingredient: true,
                    user: { select: { fullName: true } },
                    supplier: true // Include thêm NCC
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.stockTransaction.count()
        ]);

        res.status(200).json({
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy lịch sử giao dịch' });
    }
});

// --- SUPPLIERS ---

// Lấy danh sách nhà cung cấp (Có phân trang)
router.get('/suppliers', async (req: Request, res: Response) => {
    try {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.supplier.count()
        ]);

        res.status(200).json({
            data: suppliers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách nhà cung cấp' });
    }
});

router.post('/suppliers', async (req: Request, res: Response) => {
    try {
        const { name, contact, address } = req.body;
        const newSupplier = await prisma.supplier.create({
            data: { name, contact, address }
        });
        res.status(201).json(newSupplier);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi tạo nhà cung cấp' });
    }
});

router.put('/suppliers/:id', async (req: Request, res: Response) => {
    try {
        const { name, contact, address } = req.body;
        const updated = await prisma.supplier.update({
            where: { id: String(req.params.id) },
            data: { name, contact, address }
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Lỗi cập nhật nhà cung cấp' });
    }
});

router.delete('/suppliers/:id', async (req: Request, res: Response) => {
    try {
        await prisma.supplier.delete({
            where: { id: String(req.params.id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Lỗi xoá nhà cung cấp' });
    }
});

export default router;
