import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRecipeSuggestionFromAI } from '../utils/ai.service';

const router = Router();
const prisma = new PrismaClient();

// --- RECIPE MANAGEMENT (PHASE 2: AI INTEGRATION) ---

/**
 * Endpoint gợi ý công thức từ AI dựa trên tên món ăn
 * GET /recipes/suggest?menuItemName=Phở bò
 */
router.get('/recipes/suggest', async (req: Request, res: Response) => {
    try {
        const { menuItemName } = req.query;
        if (!menuItemName) {
            return res.status(400).json({ message: 'Thiếu tên món ăn để gợi ý' });
        }

        // Lấy danh sách tên các nguyên liệu đang có trong kho để AI tham chiếu
        const existingIngredients = await prisma.ingredient.findMany({
            select: { name: true }
        });
        const ingredientNames = existingIngredients.map(i => i.name);

        const suggestions = await getRecipeSuggestionFromAI(menuItemName as string, ingredientNames);
        res.status(200).json(suggestions);
    } catch (error) {
        console.error('AI Suggest Error:', error);
        res.status(500).json({ message: 'Lỗi khi gọi AI gợi ý' });
    }
});

// --- RECIPE MANAGEMENT (PHASE 1) ---

// 1. Lấy công thức của một món ăn
router.get('/recipes/:menuItemId', async (req: Request, res: Response) => {
    try {
        const { menuItemId } = req.params;
        const recipe = await prisma.menuItemIngredient.findMany({
            where: { menuItemId: String(menuItemId) },
            include: {
                ingredient: true
            }
        });
        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy công thức' });
    }
});

// 2. Thêm/Cập nhật định mức nguyên liệu cho món ăn
router.post('/recipes', async (req: Request, res: Response) => {
    try {
        const { menuItemId, ingredientId, quantity } = req.body;

        const recipeItem = await prisma.menuItemIngredient.upsert({
            where: {
                menuItemId_ingredientId: {
                    menuItemId,
                    ingredientId
                }
            },
            update: { quantity: parseFloat(quantity) },
            create: {
                menuItemId,
                ingredientId,
                quantity: parseFloat(quantity)
            }
        });

        res.status(200).json(recipeItem);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật định mức' });
    }
});

// 3. Xóa một nguyên liệu khỏi công thức
router.delete('/recipes/:menuItemId/:ingredientId', async (req: Request, res: Response) => {
    try {
        const { menuItemId, ingredientId } = req.params;
        await prisma.menuItemIngredient.delete({
            where: {
                menuItemId_ingredientId: {
                    menuItemId: String(menuItemId),
                    ingredientId: String(ingredientId)
                }
            }
        });
        res.status(200).json({ message: 'Đã xóa nguyên liệu khỏi công thức' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa định mức' });
    }
});

export default router;
