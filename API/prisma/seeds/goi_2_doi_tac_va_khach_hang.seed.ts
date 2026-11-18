import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Role, TableStatus, DiscountType } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedGoi2DoiTacVaKhachHang(prisma: PrismaClient) {
    console.log('🤝 [GÓI 2] Đang khởi tạo Đối tác, Nhân sự, 30 Khách hàng, 5 Bàn & Voucher...');

    // ==========================================
    // 1. TẠO 8 NHÀ CUNG CẤP KHỚP 8 NHÓM NGUYÊN LIỆU
    // ==========================================
    const suppliersData = [
        {
            name: 'Công ty TNHH Gia vị Việt Hưng',
            contact: '024.3827.1122',
            address: 'Cụm Công nghiệp Ngọc Hồi, Thanh Trì, Hà Nội',
        },
        {
            name: 'Vựa Nông sản Gia vị Hương Quê',
            contact: '0912.889.334',
            address: 'Chợ Đầu mối Nông sản Thủ Đức, TP. Hồ Chí Minh',
        },
        {
            name: 'Hợp tác xã Rau sạch Nông sản Xanh',
            contact: '0263.355.678',
            address: 'Thôn Đa Quý, Xã Xuân Thọ, TP. Đà Lạt, Lâm Đồng',
        },
        {
            name: 'Công ty Cổ phần Thực phẩm Vissan',
            contact: '1900.1234',
            address: '420 Nơ Trang Long, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh',
        },
        {
            name: 'Trang trại Gia cầm CP Foods Việt Nam',
            contact: '0251.383.6251',
            address: 'Khu Công nghiệp Biên Hòa 2, Đồng Nai',
        },
        {
            name: 'Vựa Thủy hải sản Biển Đông Hải Phòng',
            contact: '0936.778.899',
            address: 'Cảng cá Lạch Tray, Quận Ngô Quyền, TP. Hải Phòng',
        },
        {
            name: 'Tổng đại lý Đậu phụ & Bún mì Tân Phát',
            contact: '0904.556.789',
            address: 'Làng nghề Bún Phú Đô, Quận Nam Từ Liêm, Hà Nội',
        },
        {
            name: 'Nhà phân phối Đồ uống & Xưởng Bia tươi Hà Nội',
            contact: '024.3863.4567',
            address: '183 Hoàng Hoa Thám, Quận Ba Đình, Hà Nội',
        },
    ];

    for (const sup of suppliersData) {
        await prisma.supplier.create({ data: sup });
    }
    console.log(`  ✅ Đã tạo ${suppliersData.length} nhà cung cấp đại diện 8 nhóm nguồn hàng`);

    // ==========================================
    // 2. TẠO HỆ THỐNG NHÂN VIÊN (MẬT KHẨU: 123456)
    // ==========================================
    const plainPassword = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const usersData = [
        {
            username: 'admin',
            password: hashedPassword,
            fullName: 'Quản trị viên Hệ thống',
            role: Role.ADMIN,
        },
        {
            username: 'manager',
            password: hashedPassword,
            fullName: 'Nguyễn Tiến Dũng (Quản lý)',
            role: Role.ADMIN,
        },
        {
            username: 'waiter1',
            password: hashedPassword,
            fullName: 'Nguyễn Văn Phục Vụ',
            role: Role.CASHIER,
        },
        {
            username: 'cashier1',
            password: hashedPassword,
            fullName: 'Lê Thu Ngân (Thu ngân quầy)',
            role: Role.CASHIER,
        },
        {
            username: 'kitchen1',
            password: hashedPassword,
            fullName: 'Trần Thị Bếp (Nhân viên KDS)',
            role: Role.KITCHEN,
        },
        {
            username: 'chef_leader',
            password: hashedPassword,
            fullName: 'Vũ Đình Bếp Trưởng',
            role: Role.KITCHEN,
        },
    ];

    await prisma.user.createMany({ data: usersData });
    console.log(`  ✅ Đã tạo ${usersData.length} nhân sự đầy đủ phân quyền ADMIN, CASHIER, KITCHEN`);

    // ==========================================
    // 3. TẠO 30 KHÁCH HÀNG THỰC TẾ
    // ==========================================
    const customersData = [
        { phone: '0912345678', name: 'Nguyễn Văn An' },
        { phone: '0987654321', name: 'Trần Thị Mai' },
        { phone: '0905123987', name: 'Lê Hoàng Nam' },
        { phone: '0934567890', name: 'Phạm Thúy Hằng' },
        { phone: '0978112233', name: 'Đỗ Minh Quân' },
        { phone: '0945998877', name: 'Vũ Lan Hương' },
        { phone: '0913554433', name: 'Hoàng Đình Trọng' },
        { phone: '0982334455', name: 'Bùi Phương Thảo' },
        { phone: '0977889900', name: 'Ngô Gia Bảo' },
        { phone: '0938114477', name: 'Dương Ngọc Ánh' },
        { phone: '0966554433', name: 'Đặng Quốc Cường' },
        { phone: '0909887766', name: 'Trịnh Thu Trang' },
        { phone: '0944112233', name: 'Phan Thành Long' },
        { phone: '0988771122', name: 'Lưu Bích Ngọc' },
        { phone: '0973445566', name: 'Đoàn Trung Kiên' },
        { phone: '0932998811', name: 'Nguyễn Khánh Linh' },
        { phone: '0915667788', name: 'Trần Quốc Toàn' },
        { phone: '0981223344', name: 'Lê Quỳnh Chi' },
        { phone: '0979556677', name: 'Phạm Minh Đức' },
        { phone: '0946778899', name: 'Hoàng Mỹ Duyên' },
        { phone: '0903445566', name: 'Đinh Hữu Phước' },
        { phone: '0986112255', name: 'Vũ Thu Hoài' },
        { phone: '0937889922', name: 'Tạ Quang Huy' },
        { phone: '0918334411', name: 'Cao Kim Oanh' },
        { phone: '0972556633', name: 'Lâm Văn Hùng' },
        { phone: '0941998822', name: 'Mai Bích Trâm' },
        { phone: '0989334477', name: 'Vương Gia Huy' },
        { phone: '0935112299', name: 'Hà Diệu Thúy' },
        { phone: '0917665544', name: 'Tống Văn Đại' },
        { phone: '0975887711', name: 'Nghiêm Thùy Chi' },
    ];

    await prisma.customer.createMany({ data: customersData });
    console.log(`  ✅ Đã tạo ${customersData.length} khách hàng thành viên thực tế`);

    // ==========================================
    // 4. TẠO SƠ ĐỒ 5 BÀN ĂN (GIỮ NGUYÊN STARTER SEED)
    // ==========================================
    const tablesData = [
        { name: '1', capacity: 2, qrCode: 'QR_TABLE_01', status: TableStatus.AVAILABLE },
        { name: '2', capacity: 2, qrCode: 'QR_TABLE_02', status: TableStatus.AVAILABLE },
        { name: '3', capacity: 4, qrCode: 'QR_TABLE_03', status: TableStatus.AVAILABLE },
        { name: '4', capacity: 4, qrCode: 'QR_TABLE_04', status: TableStatus.AVAILABLE },
        { name: 'Vip 1', capacity: 8, qrCode: 'QR_VIP_01', status: TableStatus.AVAILABLE },
    ];

    await prisma.table.createMany({ data: tablesData });
    console.log(`  ✅ Đã tạo ${tablesData.length} bàn ăn giữ nguyên chuẩn starter seed`);

    // ==========================================
    // 5. TẠO 5 CHƯƠNG TRÌNH KHUYẾN MÃI (VOUCHER)
    // ==========================================
    const vouchersData = [
        {
            code: 'GIAM20K',
            description: 'Giảm trực tiếp 20.000đ cho đơn hàng từ 100.000đ',
            discountType: DiscountType.FIXED,
            discountValue: 20000,
            minOrderValue: 100000,
            isActive: true,
        },
        {
            code: 'KM10PT',
            description: 'Giảm 10% tổng hóa đơn, tối đa 50.000đ',
            discountType: DiscountType.PERCENTAGE,
            discountValue: 10,
            maxDiscount: 50000,
            minOrderValue: 0,
            isActive: true,
        },
        {
            code: 'GIAM50K',
            description: 'Giảm ngay 50.000đ cho đơn tiệc từ 300.000đ',
            discountType: DiscountType.FIXED,
            discountValue: 50000,
            minOrderValue: 300000,
            isActive: true,
        },
        {
            code: 'FREEDRINK',
            description: 'Ưu đãi tặng đồ uống trị giá 35.000đ cho đơn từ 150.000đ',
            discountType: DiscountType.FIXED,
            discountValue: 35000,
            minOrderValue: 150000,
            isActive: true,
        },
        {
            code: 'VIP100K',
            description: 'Giảm 100.000đ cho hóa đơn đại tiệc từ 600.000đ',
            discountType: DiscountType.FIXED,
            discountValue: 100000,
            minOrderValue: 600000,
            isActive: true,
        },
    ];

    await prisma.voucher.createMany({ data: vouchersData });
    console.log(`  ✅ Đã tạo ${vouchersData.length} mã voucher khuyến mãi đa dạng`);
    console.log('🎉 [GÓI 2] Hoàn tất nạp dữ liệu Đối tác & Khách hàng thành công!\n');
}

// Chạy trực tiếp độc lập khi gọi file này (npm run seed:goi2 hoặc npx tsx ...)
if (require.main === module || process.argv[1]?.replace(/\\/g, '/').endsWith('goi_2_doi_tac_va_khach_hang.seed.ts')) {
    const standalonePrisma = new PrismaClient();
    (async () => {
        try {
            console.log('🧹 [GÓI 2 STANDALONE] Đang dọn dẹp dữ liệu cũ của Đối tác & Khách hàng...');
            await standalonePrisma.stockTransaction.deleteMany();
            await standalonePrisma.order.deleteMany();
            await standalonePrisma.invoice.deleteMany();
            await standalonePrisma.message.deleteMany();
            await standalonePrisma.chatSession.deleteMany();
            await standalonePrisma.reservation.deleteMany();
            await standalonePrisma.supplier.deleteMany();
            await standalonePrisma.voucher.deleteMany();
            await standalonePrisma.table.deleteMany();
            await standalonePrisma.user.deleteMany();
            await standalonePrisma.customer.deleteMany();
            await seedGoi2DoiTacVaKhachHang(standalonePrisma);
        } catch (e) {
            console.error('❌ Lỗi khi chạy Gói 2:', e);
            process.exit(1);
        } finally {
            await standalonePrisma.$disconnect();
        }
    })();
}

