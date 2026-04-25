import { PrismaClient, Role, TableStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Xóa dữ liệu cũ theo thứ tự ưu tiên (tránh lỗi khóa ngoại)
    await prisma.stockTransaction.deleteMany();
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
    await prisma.user.deleteMany();


    // 1. Mã hóa mật khẩu bằng bcrypt
    const plainPassword = '123456'; // Mật khẩu gốc dùng chung cho mọi tài khoản test
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // 2. Tạo Nhân sự (Users) với mật khẩu đã mã hóa
    await prisma.user.createMany({
        data: [
            { username: 'admin', password: hashedPassword, fullName: 'Quản trị viên', role: Role.ADMIN },
            { username: 'waiter1', password: hashedPassword, fullName: 'Nguyễn Văn Phục Vụ', role: Role.WAITER },
            { username: 'kitchen1', password: hashedPassword, fullName: 'Trần Thị Bếp', role: Role.KITCHEN },
            { username: 'cashier1', password: hashedPassword, fullName: 'Lê Thu Ngân', role: Role.CASHIER },
        ]
    });

    // 3. Tạo Danh mục & Món ăn (Categories & Menu Items)
    await prisma.category.create({
        data: {
            name: 'Khai vị',
            menuItems: {
                create: [
                    { name: 'Salad cá ngừ', price: 55000, description: 'Rau xà lách, cá ngừ, sốt mayone', imageUrl: 'link_anh_salad.jpg' },
                    { name: 'Khoai tây chiên', price: 40000, description: 'Khoai tây sợi lớn chiên giòn' }
                ]
            }
        }
    });

    await prisma.category.create({
        data: {
            name: 'Món chính',
            menuItems: {
                create: [
                    { name: 'Beefsteak sốt tiêu đen', price: 150000, description: 'Thịt bò Úc, khoai tây, sốt tiêu' },
                    { name: 'Mì Ý hải sản', price: 120000, description: 'Tôm, mực, vẹm, sốt cà chua' },
                    { name: 'Cơm chiên dưa bò', price: 65000, description: 'Cơm chiên, dưa chua, bắp bò' }
                ]
            }
        }
    });

    await prisma.category.create({
        data: {
            name: 'Đồ uống',
            menuItems: {
                create: [
                    { name: 'Trà đào cam sả', price: 45000 },
                    { name: 'Coca Cola', price: 20000 },
                    { name: 'Bia Heineken', price: 35000 }
                ]
            }
        }
    });

    // 4. Tạo Sơ đồ bàn (Tables)
    await prisma.table.createMany({
        data: [
            { name: '1', capacity: 2, qrCode: 'QR_TABLE_01', status: TableStatus.AVAILABLE },
            { name: '2', capacity: 2, qrCode: 'QR_TABLE_02', status: TableStatus.AVAILABLE },
            { name: '3', capacity: 4, qrCode: 'QR_TABLE_03', status: TableStatus.AVAILABLE },
            { name: '4', capacity: 4, qrCode: 'QR_TABLE_04', status: TableStatus.AVAILABLE },
            { name: '5', capacity: 6, qrCode: 'QR_TABLE_05', status: TableStatus.AVAILABLE },
            { name: 'Vip 1', capacity: 8, qrCode: 'QR_VIP_01', status: TableStatus.AVAILABLE },
            { name: 'Vip 2', capacity: 12, qrCode: 'QR_VIP_02', status: TableStatus.AVAILABLE },
        ]
    });

    console.log('🌱 Đang seed dữ liệu bổ sung cho phân hệ Kho...');

    // 1. Tìm một User hợp lệ (Đầu bếp hoặc Admin) để gán quyền thực hiện giao dịch
    let actionUser = await prisma.user.findFirst({ where: { role: Role.KITCHEN } });
    if (!actionUser) {
        actionUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    }

    if (!actionUser) {
        console.log('⚠️ Không tìm thấy Đầu bếp hoặc Admin nào. Bỏ qua seed lịch sử kho.');
    } else {
        // Xóa dữ liệu kho cũ (nếu có) để tránh lỗi trùng lặp khi chạy lại seed
        await prisma.stockTransaction.deleteMany();
        await prisma.ingredient.deleteMany();
        await prisma.supplier.deleteMany();

        // 2. Tạo Nhà cung cấp (Suppliers)
        console.log('  -> Đang tạo Nhà cung cấp...');
        const supplierHanoi = await prisma.supplier.create({
            data: { name: 'Thực phẩm sạch Hà Nội', contact: '0988777666', address: 'Hoàng Mai, Hà Nội' }
        });
        const supplierMeat = await prisma.supplier.create({
            data: { name: 'Vissan Meat', contact: '19001234', address: 'Quận 1, TP.HCM' }
        });

        // 3. Tạo Nguyên vật liệu (Ingredients)
        console.log('  -> Đang tạo Nguyên vật liệu...');
        const beef = await prisma.ingredient.create({
            data: { name: 'Thịt bò thăn Úc', unit: 'kg', currentStock: 15.5, minStock: 5, supplierId: supplierMeat.id }
        });
        const potato = await prisma.ingredient.create({
            data: { name: 'Khoai tây Đà Lạt', unit: 'kg', currentStock: 20, minStock: 10, supplierId: supplierHanoi.id }
        });
        const wine = await prisma.ingredient.create({
            data: { name: 'Rượu vang đỏ', unit: 'chai', currentStock: 12, minStock: 3, supplierId: supplierHanoi.id }
        });

        // 4. Tạo Lịch sử giao dịch kho mẫu (Stock Transactions)
        console.log('  -> Đang tạo Lịch sử kiểm kê/nhập kho...');

        // - Đầu bếp nhận ca: Kiểm kê đầu ca
        await prisma.stockTransaction.create({
            data: {
                type: TransactionType.AUDIT_START,
                quantity: 15.5,
                note: 'Số lượng thực tế khớp với tồn kho đầu ca sáng',
                ingredientId: beef.id,
                userId: actionUser.id
            }
        });

        // - Bếp trưởng xuất hủy hàng hỏng
        await prisma.stockTransaction.create({
            data: {
                type: TransactionType.EXPORT,
                quantity: 0.5,
                note: 'Lọc bỏ phần thịt vụn, dập nát',
                ingredientId: beef.id,
                userId: actionUser.id
            }
        });

        // - Quản lý/Bếp nhập thêm hàng mới trong ngày
        await prisma.stockTransaction.create({
            data: {
                type: TransactionType.IMPORT,
                quantity: 10,
                note: 'Nhập bổ sung khẩn cấp từ Vissan',
                ingredientId: beef.id,
                userId: actionUser.id
            }
        });

        console.log('✅ Đã thêm xong dữ liệu Kho & Cung ứng!');
    }

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