import { Router, type Request, type Response } from 'express';
import { PrismaClient, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Khách đặt bàn online
router.post('/reservations', async (req: Request, res: Response) => {
    try {
        const { customerName, customerPhone, guests, reservationTime, note, tableId } = req.body;

        const reservationTimeDate = new Date(reservationTime);
        const guestCount = Number(guests);

        let assignedTableId: string | undefined = tableId || undefined;
        let finalStatus: ReservationStatus = tableId ? 'CONFIRMED' : 'PENDING';

        // Nếu admin gán bàn ngay lúc tạo
        if (assignedTableId) {
            await prisma.table.update({
                where: { id: assignedTableId },
                data: { status: 'RESERVED' }
            });
        } else if (guestCount <= 8) {
            // Thuật toán: Nếu dưới 8 người, thử tìm bàn trống và gán gợi ý
            const availableTable = await prisma.table.findFirst({
                where: {
                    status: 'AVAILABLE',
                    capacity: { gte: guestCount }
                },
                orderBy: { capacity: 'asc' }
            });

            if (availableTable) {
                assignedTableId = availableTable.id;
            }
        }

        const reservation = await prisma.reservation.create({
            data: {
                customerName,
                customerPhone,
                guests: guestCount,
                reservationTime: reservationTimeDate,
                note,
                status: finalStatus,
                tableId: assignedTableId || null
            }
        });

        res.status(201).json(reservation);
    } catch (error) {
        console.error('Lỗi đặt bàn:', error);
        res.status(500).json({ error: 'Lỗi khi xử lý yêu cầu đặt bàn' });
    }
});

// Admin lấy danh sách đặt bàn
router.get('/reservations', async (req: Request, res: Response) => {
    try {
        const keyword = req.query.keyword as string;
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (keyword) {
            where.OR = [
                { customerName: { contains: keyword, mode: 'insensitive' } },
                { customerPhone: { contains: keyword, mode: 'insensitive' } }
            ];
        }

        const [reservations, total] = await Promise.all([
            prisma.reservation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { reservationTime: 'asc' },
                include: { table: true }
            }),
            prisma.reservation.count({ where })
        ]);

        res.status(200).json({
            data: reservations,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách đặt bàn' });
    }
});

// Admin cập nhật trạng thái đặt bàn (Xác nhận/Hủy/Hoàn thành)
router.patch('/reservations/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reservationId = String(id);
        const { status, tableId, customerName, customerPhone, guests, reservationTime, note } = req.body;

        const current = await prisma.reservation.findUnique({ where: { id: reservationId } });
        if (!current) return res.status(404).json({ error: 'Không tìm thấy đơn đặt bàn' });

        const finalTableId = tableId !== undefined ? tableId : current.tableId;
        const finalTime = reservationTime ? new Date(reservationTime) : current.reservationTime;

        // KIỂM TRA XUNG ĐỘT (2 TIẾNG)
        if (finalTableId && (status === 'CONFIRMED' || status === 'ARRIVED')) {
            const bufferTime = 2 * 60 * 60 * 1000; // 2 giờ
            const startRange = new Date(finalTime.getTime() - bufferTime);
            const endRange = new Date(finalTime.getTime() + bufferTime);

            const conflict = await prisma.reservation.findFirst({
                where: {
                    tableId: finalTableId,
                    status: { in: ['CONFIRMED', 'ARRIVED'] },
                    reservationTime: {
                        gt: startRange,
                        lt: endRange
                    },
                    NOT: { id: reservationId }
                }
            });

            if (conflict) {
                return res.status(400).json({ 
                    error: `Bàn này đã có lịch đặt lúc ${new Date(conflict.reservationTime).toLocaleTimeString('vi-VN')} (Khoảng cách yêu cầu 2 tiếng)` 
                });
            }
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (tableId !== undefined) updateData.tableId = tableId || null;
        if (customerName !== undefined) updateData.customerName = customerName;
        if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
        if (guests !== undefined) updateData.guests = Number(guests);
        if (reservationTime !== undefined) updateData.reservationTime = new Date(reservationTime);
        if (note !== undefined) updateData.note = note;

        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: updateData
        });

        // Xử lý thay đổi trạng thái bàn
        const oldTableId = current.tableId;
        const newTableId = updated.tableId;

        // 1. Giải phóng bàn cũ nếu đổi bàn
        if (oldTableId && oldTableId !== newTableId) {
            // Kiểm tra xem bàn cũ còn lịch CONFIRMED/ARRIVED nào khác không
            const otherActive = await prisma.reservation.findFirst({
                where: { tableId: oldTableId, status: { in: ['CONFIRMED', 'ARRIVED'] } }
            });
            if (!otherActive) {
                await prisma.table.update({
                    where: { id: oldTableId },
                    data: { status: 'AVAILABLE' }
                });
            }
        }

        // 2. Cập nhật trạng thái bàn mới
        if (newTableId) {
            if (status === 'ARRIVED') {
                // Khách đến -> Đang phục vụ
                await prisma.table.update({
                    where: { id: newTableId },
                    data: { status: 'OCCUPIED' }
                });
            } else if (status === 'CONFIRMED') {
                // Chỉ đánh dấu là Đã đặt
                await prisma.table.update({
                    where: { id: newTableId },
                    data: { status: 'RESERVED' }
                });
            } else if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status)) {
                // Giải phóng bàn nếu không còn lịch nào khác
                const otherActive = await prisma.reservation.findFirst({
                    where: { 
                        tableId: newTableId, 
                        status: { in: ['CONFIRMED', 'ARRIVED'] },
                        NOT: { id: reservationId }
                    }
                });
                if (!otherActive) {
                    await prisma.table.update({
                        where: { id: newTableId },
                        data: { status: 'AVAILABLE' }
                    });
                }
            }
        }

        res.status(200).json(updated);
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        res.status(500).json({ error: 'Lỗi cập nhật đặt bàn' });
    }
});

export default router;
