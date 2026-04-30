import { PrismaClient, Role, TableStatus, TransactionType, DiscountType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Đang bắt đầu quá trình Seed dữ liệu...');

    // Xóa dữ liệu cũ theo thứ tự ưu tiên (tránh lỗi khóa ngoại)
    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
    await prisma.stockTransaction.deleteMany();
    await prisma.menuItemIngredient.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.table.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.user.deleteMany();
    await prisma.customer.deleteMany();

    // 1. Mã hóa mật khẩu
    const plainPassword = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // 2. Tạo Nhân sự (Users)
    console.log('👥 Đang tạo tài khoản nhân viên...');
    await prisma.user.createMany({
        data: [
            { username: 'admin', password: hashedPassword, fullName: 'Quản trị viên', role: Role.ADMIN },
            { username: 'waiter1', password: hashedPassword, fullName: 'Nguyễn Văn Phục Vụ', role: Role.CASHIER },
            { username: 'kitchen1', password: hashedPassword, fullName: 'Trần Thị Bếp', role: Role.KITCHEN },
            { username: 'cashier1', password: hashedPassword, fullName: 'Lê Thu Ngân', role: Role.CASHIER },
        ]
    });

    const actionUser = await prisma.user.findFirst({ where: { username: 'admin' } });

    // 3. Tạo Danh mục
    console.log('📁 Đang tạo danh mục món ăn...');
    const catAppetizer = await prisma.category.create({ data: { name: 'Khai vị' } });
    const catMain = await prisma.category.create({ data: { name: 'Món chính' } });
    const catDrink = await prisma.category.create({ data: { name: 'Đồ uống' } });

    // 4. Tạo Nguyên liệu (Ingredients)
    console.log('📦 Đang tạo nguyên liệu kho...');
    const beef = await prisma.ingredient.create({ data: { name: 'Thịt bò thăn Úc', unit: 'g', currentStock: 10000, minStock: 2000 } });
    const potato = await prisma.ingredient.create({ data: { name: 'Khoai tây', unit: 'g', currentStock: 5000, minStock: 1000 } });
    const egg = await prisma.ingredient.create({ data: { name: 'Trứng gà', unit: 'quả', currentStock: 50, minStock: 10 } });
    const oil = await prisma.ingredient.create({ data: { name: 'Dầu ăn', unit: 'ml', currentStock: 2000, minStock: 500 } });

    // 5. Tạo Món ăn & Định mức (Menu Items & Recipes)
    console.log('🍳 Đang tạo món ăn và công thức...');
    
    // Món: Beefsteak
    await prisma.menuItem.create({
        data: {
            name: 'Beefsteak sốt tiêu đen',
            price: 150000,
            description: 'Thịt bò Úc, khoai tây, sốt tiêu',
            categoryId: catMain.id,
            ingredients: {
                create: [
                    { ingredientId: beef.id, quantity: 200 },
                    { ingredientId: potato.id, quantity: 100 },
                    { ingredientId: oil.id, quantity: 20 }
                ]
            }
        }
    });

    // Món: Khoai tây chiên
    await prisma.menuItem.create({
        data: {
            name: 'Khoai tây chiên',
            price: 40000,
            description: 'Khoai tây sợi lớn chiên giòn',
            categoryId: catAppetizer.id,
            ingredients: {
                create: [
                    { ingredientId: potato.id, quantity: 150 },
                    { ingredientId: oil.id, quantity: 50 }
                ]
            }
        }
    });

    // Món: Trà đào
    await prisma.menuItem.create({
        data: {
            name: 'Trà đào cam sả',
            price: 45000,
            categoryId: catDrink.id
        }
    });

    // 6. Tạo Sơ đồ bàn
    console.log('🪑 Đang tạo sơ đồ bàn...');
    await prisma.table.createMany({
        data: [
            { name: '1', capacity: 2, qrCode: 'QR_TABLE_01', status: TableStatus.AVAILABLE },
            { name: '2', capacity: 2, qrCode: 'QR_TABLE_02', status: TableStatus.AVAILABLE },
            { name: '3', capacity: 4, qrCode: 'QR_TABLE_03', status: TableStatus.AVAILABLE },
            { name: '4', capacity: 4, qrCode: 'QR_TABLE_04', status: TableStatus.AVAILABLE },
            { name: 'Vip 1', capacity: 8, qrCode: 'QR_VIP_01', status: TableStatus.AVAILABLE },
        ]
    });

    // 7. Tạo Nhà cung cấp & Giao dịch kho
    console.log('🚛 Đang tạo nhà cung cấp và lịch sử kho...');
    const supplier = await prisma.supplier.create({
        data: { name: 'Vissan Meat', contact: '19001234', address: 'Quận 1, TP.HCM' }
    });

    if (actionUser) {
        await prisma.stockTransaction.create({
            data: {
                type: TransactionType.IMPORT,
                quantity: 5000,
                note: 'Nhập hàng đầu tháng',
                ingredientId: beef.id,
                userId: actionUser.id,
                supplierId: supplier.id
            }
        });
    }

    // 8. Tạo Voucher mẫu
    console.log('🎫 Đang tạo mã giảm giá...');
    await prisma.voucher.createMany({
        data: [
            { 
                code: 'GIAM20K', 
                description: 'Giảm trực tiếp 20.000đ cho đơn từ 100k', 
                discountType: DiscountType.FIXED, 
                discountValue: 20000, 
                minOrderValue: 100000,
                isActive: true
            },
            { 
                code: 'KM10PT', 
                description: 'Giảm 10% tổng đơn, tối đa 50k', 
                discountType: DiscountType.PERCENTAGE, 
                discountValue: 10, 
                maxDiscount: 50000,
                minOrderValue: 0,
                isActive: true
            }
        ]
    });

    console.log('✅ Chèn dữ liệu mẫu thành công!');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi khi seed dữ liệu:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });