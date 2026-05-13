import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supers3cr3t_jwt_key_for_d4tn';

// Đăng ký/Đăng nhập khách hàng (Trả về JWT)
router.post('/customers/login', async (req: Request, res: Response) => {
    try {
        const { phone, name } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Số điện thoại là bắt buộc' });
        }

        // Upsert customer: Nếu có rồi thì cập nhật tên (nếu gửi lên), chưa có thì tạo mới
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: name ? { name } : {},
            create: { phone, name: name || 'Khách hàng' }
        });

        // Tạo JWT cho khách hàng
        const token = jwt.sign(
            { id: customer.id, phone: customer.phone, role: 'CUSTOMER' },
            JWT_SECRET,
            { expiresIn: '7d' } // Khách hàng có thể duy trì phiên 7 ngày
        );

        // Trả về token và thông tin khách hàng
        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            customer
        });
    } catch (error) {
        console.error('Lỗi đăng nhập khách hàng:', error);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
});

// Lấy thông tin khách hàng hiện tại (Verify token)
router.get('/customers/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        const customer = await prisma.customer.findUnique({
            where: { id: decoded.id }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Khách hàng không tồn tại' });
        }

        res.status(200).json(customer);
    } catch (error) {
        res.status(401).json({ error: 'Phiên làm việc hết hạn' });
    }
});

export default router;
