import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Đang chuyển đổi dữ liệu E_WALLET sang VNPAY...');
    
    const updatedInvoices = await prisma.invoice.updateMany({
        where: { paymentMethod: 'E_WALLET' as any },
        data: { paymentMethod: 'VNPAY' as any }
    });
    console.log(`✅ Đã cập nhật ${updatedInvoices.count} hóa đơn.`);

    const updatedPayments = await prisma.payment.updateMany({
        where: { method: 'E_WALLET' as any },
        data: { method: 'VNPAY' as any }
    });
    console.log(`✅ Đã cập nhật ${updatedPayments.count} bản ghi thanh toán.`);
}

main()
    .catch((e) => {
        console.error('❌ Lỗi khi chuyển đổi dữ liệu:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
