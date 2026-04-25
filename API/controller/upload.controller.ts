import { Router, type Request, type Response } from 'express';
import { upload } from '../middleware/upload';
import { minioClient } from '../utils/minio';
import path from 'path';

const router = Router();
const bucketName = process.env.MINIO_BUCKET || 'restaurant-images';

router.post('/api/upload', upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Không tìm thấy file tải lên' });
            return;
        }

        const file = req.file;
        const extension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        await minioClient.putObject(
            bucketName,
            fileName,
            file.buffer,
            file.size,
            { 'Content-Type': file.mimetype }
        );

        // Construct public URL
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const url = `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;

        res.status(200).json({
            message: 'Tải lên thành công',
            url: url
        });
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Lỗi khi tải ảnh lên MinIO', error: error.message });
    }
});

export default router;
