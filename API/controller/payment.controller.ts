import { type Request, type Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

// Cấu hình VNPay từ .env
const vnp_TmnCode = process.env.VNP_TMN_CODE || '';
const vnp_HashSecret = process.env.VNP_HASH_SECRET || '';
const vnp_Url = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/payment-result';

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

        const createDate = moment().format('YYYYMMDDHHmmss');
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress;

        if (Array.isArray(ipAddr)) ipAddr = ipAddr[0];

        const vnp_Params: any = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnp_TmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: invoice.id.toString(),
            vnp_OrderInfo: `Thanh toan hoa don ban ${invoice.table?.name || 'N/A'}`,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(invoice.finalAmount * 100),
            vnp_ReturnUrl: vnp_ReturnUrl,
            vnp_IpAddr: ipAddr || '127.0.0.1',
            vnp_CreateDate: createDate,
        };

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Sắp xếp các tham số theo thứ tự alphabet
        const sortedParams = Object.keys(vnp_Params)
            .sort()
            .reduce((acc: any, key) => {
                acc[key] = vnp_Params[key];
                return acc;
            }, {});

        // Tạo signData đúng chuẩn - Dùng qs với encode: false
        const signData = qs.stringify(sortedParams, { encode: false });
        
        // Tạo chữ ký HMAC-SHA512
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        console.log('=== VNPAY CREATE DEBUG ===');
        console.log('SignData:', signData);
        console.log('SecureHash:', signed);

        // Thêm hash và tạo URL cuối cùng (vẫn dùng encode: false cho URL)
        sortedParams['vnp_SecureHash'] = signed;
        const paymentUrl = vnp_Url + '?' + qs.stringify(sortedParams, { encode: false });

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

// 2. VNPay IPN (Callback từ server VNPay)
router.get('/payment/vnpay/ipn', async (req: Request, res: Response) => {
    try {
        let vnp_Params: any = { ...req.query };

        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sắp xếp và tạo signData giống hệt lúc tạo URL
        const sortedParams = Object.keys(vnp_Params)
            .sort()
            .reduce((acc: any, key) => {
                acc[key] = vnp_Params[key];
                return acc;
            }, {});

        const signData = qs.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac("sha512", vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        console.log('=== VNPAY IPN DEBUG ===');
        console.log('Received Hash :', secureHash);
        console.log('Calculated    :', signed);
        console.log('SignData IPN  :', signData);

        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        }

        const invoiceId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const vnpayTranNo = vnp_Params['vnp_TransactionNo'];
        const amount = Number(vnp_Params['vnp_Amount']) / 100;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { orders: true }
        });

        if (!invoice) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        if (invoice.finalAmount !== amount) {
            return res.status(200).json({ RspCode: '04', Message: 'Amount mismatch' });
        }

        if (invoice.isPaid) {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (responseCode === '00') {
            // Giao dịch thành công - Thực hiện nghiệp vụ cập nhật đơn hàng
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

            if (io) {
                io.to(`table_${invoice.tableId}`).emit('PAYMENT_SUCCESS', { invoiceId });
                io.emit('staff_notification', { type: 'TABLE_UPDATED' });
            }

            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success (Transaction Failed)' });
        }
    } catch (error) {
        console.error('VNPay IPN Error:', error);
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
});

export default router;
