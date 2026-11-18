import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { seedGoi1BepVaThucDon } from './seeds/goi_1_bep_va_thuc_don.seed';
import { seedGoi2DoiTacVaKhachHang } from './seeds/goi_2_doi_tac_va_khach_hang.seed';

const prisma = new PrismaClient();

async function main() {
    // Nhận tham số dòng lệnh nếu người dùng muốn chạy lẻ gói nào
    // Ví dụ: npx tsx prisma/seed.ts 1  hoặc  npm run seed -- 1
    const rawArgs = process.argv.slice(2).map(arg => arg.toLowerCase());
    const runOnlyGoi1 = rawArgs.includes('1') || rawArgs.includes('goi1');
    const runOnlyGoi2 = rawArgs.includes('2') || rawArgs.includes('goi2');
    const runAll = !runOnlyGoi1 && !runOnlyGoi2;

    console.log('======================================================');
    if (runOnlyGoi1) {
        console.log('🚀 BẮT ĐẦU CHẠY RIÊNG LẺ: GÓI 1 (BẾP & THỰC ĐƠN)');
    } else if (runOnlyGoi2) {
        console.log('🚀 BẮT ĐẦU CHẠY RIÊNG LẺ: GÓI 2 (ĐỐI TÁC, NHÂN SỰ & KHÁCH HÀNG)');
    } else {
        console.log('🚀 BẮT ĐẦU QUÁ TRÌNH SEED TOÀN BỘ: GÓI 1 & GÓI 2');
    }
    console.log('======================================================\n');

    // 1. Dọn dẹp dữ liệu tương ứng
    console.log('🧹 [BƯỚC 0] Đang dọn dẹp dữ liệu cũ...');
    if (runAll) {
        await prisma.stockTransaction.deleteMany();
        await prisma.menuItemIngredient.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.order.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.message.deleteMany();
        await prisma.chatSession.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.menuItem.deleteMany();
        await prisma.ingredient.deleteMany();
        await prisma.category.deleteMany();
        await prisma.supplier.deleteMany();
        await prisma.voucher.deleteMany();
        await prisma.table.deleteMany();
        await prisma.user.deleteMany();
        await prisma.customer.deleteMany();
    } else if (runOnlyGoi1) {
        await prisma.orderItem.deleteMany();
        await prisma.menuItemIngredient.deleteMany();
        await prisma.menuItem.deleteMany();
        await prisma.ingredient.deleteMany();
        await prisma.category.deleteMany();
    } else if (runOnlyGoi2) {
        await prisma.stockTransaction.deleteMany();
        await prisma.order.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.message.deleteMany();
        await prisma.chatSession.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.supplier.deleteMany();
        await prisma.voucher.deleteMany();
        await prisma.table.deleteMany();
        await prisma.user.deleteMany();
        await prisma.customer.deleteMany();
    }
    console.log('✅ Đã dọn dẹp xong!\n');

    // 2. Chạy Gói 1
    if (runAll || runOnlyGoi1) {
        await seedGoi1BepVaThucDon(prisma);
    }

    // 3. Chạy Gói 2
    if (runAll || runOnlyGoi2) {
        await seedGoi2DoiTacVaKhachHang(prisma);
    }

    // 4. Thống kê
    console.log('======================================================');
    console.log('🎉 TỔNG KẾT TRẠNG THÁI DATABASE HIỆN TẠI:');
    if (runAll || runOnlyGoi1) {
        const [totalCategories, totalIngredients, totalMenuItems, totalRecipes] = await Promise.all([
            prisma.category.count(),
            prisma.ingredient.count(),
            prisma.menuItem.count(),
            prisma.menuItemIngredient.count(),
        ]);
        console.log(`  - [Gói 1] Danh mục chế biến (Category): ${totalCategories}`);
        console.log(`  - [Gói 1] Nguyên liệu kho bếp Việt (Ingredient): ${totalIngredients}`);
        console.log(`  - [Gói 1] Món ăn thực đơn (MenuItem): ${totalMenuItems}`);
        console.log(`  - [Gói 1] Công thức định mức (MenuItemIngredient): ${totalRecipes}`);
    }
    if (runAll || runOnlyGoi2) {
        const [totalSuppliers, totalUsers, totalCustomers, totalTables, totalVouchers] = await Promise.all([
            prisma.supplier.count(),
            prisma.user.count(),
            prisma.customer.count(),
            prisma.table.count(),
            prisma.voucher.count(),
        ]);
        console.log(`  - [Gói 2] Nhà cung cấp nguồn hàng (Supplier): ${totalSuppliers}`);
        console.log(`  - [Gói 2] Tài khoản nhân sự (User): ${totalUsers}`);
        console.log(`  - [Gói 2] Khách hàng thành viên (Customer): ${totalCustomers}`);
        console.log(`  - [Gói 2] Bàn ăn phục vụ (Table): ${totalTables}`);
        console.log(`  - [Gói 2] Mã khuyến mãi (Voucher): ${totalVouchers}`);
    }
    console.log('======================================================\n');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi khi thực thi seed dữ liệu:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
