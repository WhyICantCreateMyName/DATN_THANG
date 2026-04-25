import type { Request, Response } from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supers3cr3t_jwt_key_for_d4tn';

// Đăng nhập
router.post('/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: 'Vui lòng cung cấp username và password' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Tài khoản đã bị khóa' });
            return;
        }

        // Tạo JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' } // Mật khẩu có hiệu lực 1 ngày
        );

        // Set Cookie
        console.log('🍪 Đang thiết lập Cookie token cho user:', user.username);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Bắt buộc false cho HTTP nội bộ
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 1 ngày
        });

        // Trả về thông tin cơ bản
        res.status(200).json({
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập' });
    }
});

// Kiểm tra phiên đăng nhập (Phiên làm việc hiện tại)
router.get('/auth/me', async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({ error: 'Chưa đăng nhập (Thiếu token)' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, fullName: true, role: true, isActive: true }
        });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Tài khoản không tồn tại hoặc bị khóa' });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
});

// Đăng xuất
router.post('/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.status(200).json({ message: 'Đăng xuất thành công' });
});

export default router;
