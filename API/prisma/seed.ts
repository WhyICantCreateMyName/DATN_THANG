import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { seedGoi1BepVaThucDon } from './seeds/goi_1_bep_va_thuc_don.seed';
import { seedGoi2DoiTacVaKhachHang } from './seeds/goi_2_doi_tac_va_khach_hang.seed';

const prisma = new PrismaClient();

async function main() {
    console.log('======================================================');
    console.log('🚀 BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU NHÀ HÀNG (GÓI 1 & GÓI 2)');
    console.log('======================================================\n');

    // 1. Xóa dữ liệu cũ theo thứ tự ưu tiên (tránh lỗi khóa ngoại)
    console.log('🧹 [BƯỚC 0] Đang dọn dẹp dữ liệu cũ trong cơ sở dữ liệu...');
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
    console.log('✅ Đã dọn dẹp sạch toàn bộ dữ liệu cũ!\n');

    // 2. Chạy Gói 1: Bếp & Thực đơn
    await seedGoi1BepVaThucDon(prisma);

    // 3. Chạy Gói 2: Đối tác, Nhân sự & Khách hàng
    await seedGoi2DoiTacVaKhachHang(prisma);

    // 4. Thống kê tổng số bản ghi đã nạp
    const [
        totalCategories,
        totalIngredients,
        totalMenuItems,
        totalRecipes,
        totalSuppliers,
        totalUsers,
        totalCustomers,
        totalTables,
        totalVouchers,
    ] = await Promise.all([
        prisma.category.count(),
        prisma.ingredient.count(),
        prisma.menuItem.count(),
        prisma.menuItemIngredient.count(),
        prisma.supplier.count(),
        prisma.user.count(),
        prisma.customer.count(),
        prisma.table.count(),
        prisma.voucher.count(),
    ]);

    console.log('======================================================');
    console.log('🎉 TỔNG KẾT DỮ LIỆU SEED ĐÃ NẠP THÀNH CÔNG:');
    console.log(`  - Danh mục chế biến (Category): ${totalCategories}`);
    console.log(`  - Nguyên liệu kho bếp Việt (Ingredient): ${totalIngredients}`);
    console.log(`  - Món ăn thực đơn (MenuItem): ${totalMenuItems}`);
    console.log(`  - Công thức định mức (MenuItemIngredient): ${totalRecipes}`);
    console.log(`  - Nhà cung cấp nguồn hàng (Supplier): ${totalSuppliers}`);
    console.log(`  - Tài khoản nhân sự (User): ${totalUsers}`);
    console.log(`  - Khách hàng thành viên (Customer): ${totalCustomers}`);
    console.log(`  - Bàn ăn phục vụ (Table): ${totalTables}`);
    console.log(`  - Mã khuyến mãi (Voucher): ${totalVouchers}`);
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
