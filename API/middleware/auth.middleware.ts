import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supers3cr3t_jwt_key_for_d4tn';

export interface DecodedUser {
    id: string;
    username: string;
    role: string;
}

// Mở rộng interface Request của Express để chứa thông tin user
declare global {
    namespace Express {
        interface Request {
            user?: DecodedUser;
        }
    }
}

// Middleware xác thực token
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({ error: 'Truy cập bị từ chối (Vui lòng đăng nhập)' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
        req.user = decoded; // Gắn thông tin vào request
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

// Middleware phân quyền
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: 'Chưa xác thực người dùng' });
            return; // Chưa đăng nhập
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Không có quyền truy cập !' });
            return; // Đã đăng nhập nhưng không đủ quyền
        }

        next(); // Đủ quyền, đi tiếp
    };
};
