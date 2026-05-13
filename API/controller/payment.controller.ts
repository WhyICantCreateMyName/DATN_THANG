import { type Request, type Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';
import { getIO } from '../socket';
import { createVNPayUrl, verifyVNPayReturn } from '../utils/vnpay';

const router = Router();
const prisma = new PrismaClient();

// 1. Tạo URL thanh toán
router.post('/payment/vnpay/create-url', async (req: Request, res: Response) => {
    try {
        const { invoiceId, bankCode } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { table: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
        }

        const ipAddrRaw = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '127.0.0.1';

        const ipAddr = (Array.isArray(ipAddrRaw) ? ipAddrRaw[0] : String(ipAddrRaw)) || '127.0.0.1';

        const orderInfo = `Thanh toan hoa don ban ${invoice.table?.name || 'N/A'}`;
        const amount = invoice.finalAmount;

        // Gọi hàm tiện ích đã map từ dự án chuẩn
        const paymentUrl = createVNPayUrl(invoice.id, amount, orderInfo, ipAddr);

        // Cập nhật phương thức thanh toán cho hóa đơn
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { paymentMethod: 'E_WALLET' }
        });

        res.status(200).json({ url: paymentUrl });
    } catch (error) {
        console.error('Create VNPay URL Error:', error);
        res.status(500).json({ error: 'Lỗi khi tạo URL thanh toán' });
    }
});


// 3. VNPay Callback (Dành cho trình duyệt khách hàng chuyển hướng về)
router.get('/payment/vnpay/callback', async (req: Request, res: Response) => {
    try {
        let vnp_Params: any = { ...req.query };
        const isValid = verifyVNPayReturn(vnp_Params);
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const invoiceId = vnp_Params['vnp_TxnRef'];
        const vnpayTranNo = vnp_Params['vnp_TransactionNo'];
        const amount = Number(vnp_Params['vnp_Amount']) / 100;

        if (!isValid) {
            return res.send(`
                <div style="text-align: center; padding: 50px; font-family: sans-serif;">
                    <h2 style="color: red;">Lỗi xác thực chữ ký!</h2>
                    <p>Giao dịch có thể không an toàn. Vui lòng liên hệ nhân viên.</p>
                </div>
            `);
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { orders: true }
        });

        if (!invoice) {
            return res.send('<h2>Không tìm thấy hóa đơn!</h2>');
        }

        if (responseCode === '00' && !invoice.isPaid) {
            // Giao dịch thành công - Cập nhật DB
            await prisma.$transaction(async (tx) => {
                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { isPaid: true }
                });

                await tx.payment.create({
                    data: {
                        amount: amount,
                        method: 'E_WALLET',
                        vnpayTransactionNo: vnpayTranNo,
                        invoiceId: invoiceId
                    }
                });

                await tx.order.updateMany({
                    where: { id: { in: invoice.orders.map(o => o.id) } },
                    data: { status: 'COMPLETED' }
                });

                const remaining = await tx.order.count({
                    where: {
                        chatSessionId: invoice.chatSessionId,
                        status: { in: ['PENDING', 'COOKING', 'READY', 'SERVED', 'WAITING_APPROVAL'] }
                    }
                });

                if (remaining === 0 && invoice.chatSessionId) {
                    await tx.chatSession.update({
                        where: { id: invoice.chatSessionId },
                        data: { isActive: false, endTime: new Date() }
                    });
                    await tx.table.update({
                        where: { id: invoice.tableId },
                        data: { status: 'AVAILABLE' }
                    });
                }
            });

            // Bắn Socket báo cho Admin POS đóng mã QR
            const io = getIO();
            if (io) {
                io.to(`table_${invoice.tableId}`).emit('PAYMENT_SUCCESS', { invoiceId });
                io.emit('staff_notification', { type: 'TABLE_UPDATED' });
            }

            return res.send(`
                <div style="text-align: center; padding: 100px 20px; font-family: -apple-system, sans-serif; background: #f9fafb; min-height: 100vh;">
                    <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); display: inline-block; max-width: 400px;">
                        <div style="color: #10b981; font-size: 64px; margin-bottom: 20px;">✓</div>
                        <h1 style="margin: 0 0 10px; color: #111827; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">Thanh toán xong!</h1>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">Cảm ơn quý khách đã ủng hộ nhà hàng. Chúc quý khách một ngày tốt lành!</p>
                        <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                            <p style="color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Mã hóa đơn: ${invoice.id.slice(0, 8)}</p>
                        </div>
                    </div>
                </div>
            `);
        }

        // Trường hợp đã thanh toán rồi hoặc lỗi giao dịch từ VNPay
        return res.send(`
            <div style="text-align: center; padding: 50px; font-family: sans-serif;">
                <h2>Trạng thái giao dịch: ${responseCode === '00' ? 'Đã được xác nhận trước đó' : 'Không thành công'}</h2>
                <p>Vui lòng kiểm tra lại ứng dụng ngân hàng hoặc liên hệ nhân viên quán.</p>
            </div>
        `);
    } catch (error) {
        console.error('VNPay Callback Error:', error);
        res.status(500).send('Đã có lỗi xảy ra trong quá trình xử lý thanh toán.');
    }
});

export default router;
