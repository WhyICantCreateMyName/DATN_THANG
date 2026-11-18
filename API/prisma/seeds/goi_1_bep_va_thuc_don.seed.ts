import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

export async function seedGoi1BepVaThucDon(prisma: PrismaClient) {
    console.log('🍳 [GÓI 1 - BỔ SUNG] Đang nạp thêm Danh mục, Nguyên liệu & Thực đơn vào hệ thống...');

    // ==========================================
    // 1. TẠO HOẶC CẬP NHẬT DANH MỤC THEO CÁCH CHẾ BIẾN (UPSERT - KHÔNG XÓA STARTER)
    // ==========================================
    const categoryNames = [
        'Khai vị & Gỏi / Nộm',
        'Món Xào',
        'Món Chiên & Rán',
        'Món Nướng',
        'Món Hấp & Luộc',
        'Món Kho & Om',
        'Món Canh & Lẩu',
        'Đồ Uống & Bia',
        'Món Tráng Miệng',
    ];

    const categoryMap: Record<string, string> = {};
    for (const name of categoryNames) {
        const cat = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        categoryMap[name] = cat.id;
    }
    console.log(`  ✅ Đã đảm bảo tồn tại ${categoryNames.length} danh mục theo phương pháp chế biến`);

    // ==========================================
    // 2. NẠP 70+ NGUYÊN LIỆU KHO BẾP VIỆT (AN TOÀN - KHÔNG TRÙNG LẶP)
    // ==========================================
    const ingredientsData = [
        // Nhóm 1: Gia vị khô & lỏng cơ bản
        { name: 'Nước mắm truyền thống', unit: 'ml', currentStock: 20000, minStock: 5000 },
        { name: 'Muối tinh', unit: 'g', currentStock: 10000, minStock: 2000 },
        { name: 'Đường cát trắng', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Bột ngọt (mì chính)', unit: 'g', currentStock: 8000, minStock: 2000 },
        { name: 'Hạt nêm thịt heo', unit: 'g', currentStock: 10000, minStock: 2500 },
        { name: 'Hạt tiêu đen xay', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Dầu ăn thực vật', unit: 'ml', currentStock: 30000, minStock: 5000 },
        { name: 'Nước tương (xì dầu)', unit: 'ml', currentStock: 10000, minStock: 2000 },
        { name: 'Dầu hào', unit: 'ml', currentStock: 8000, minStock: 2000 },
        { name: 'Giấm gạo', unit: 'ml', currentStock: 6000, minStock: 1500 },
        { name: 'Tương ớt', unit: 'ml', currentStock: 8000, minStock: 2000 },
        { name: 'Sa tế tôm', unit: 'ml', currentStock: 5000, minStock: 1500 },
        { name: 'Bột năng', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Bột chiên giòn', unit: 'g', currentStock: 6000, minStock: 1500 },
        { name: 'Ngũ vị hương', unit: 'gói', currentStock: 50, minStock: 10 },

        // Nhóm 2: Gia vị tươi & Thảo mộc
        { name: 'Hành tím ta', unit: 'g', currentStock: 10000, minStock: 2000 },
        { name: 'Tỏi củ', unit: 'g', currentStock: 8000, minStock: 2000 },
        { name: 'Gừng già', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Sả cây tươi', unit: 'g', currentStock: 6000, minStock: 1500 },
        { name: 'Ớt cay tươi', unit: 'g', currentStock: 3000, minStock: 800 },
        { name: 'Riềng tươi', unit: 'g', currentStock: 4000, minStock: 1000 },
        { name: 'Nghệ tươi', unit: 'g', currentStock: 3000, minStock: 800 },
        { name: 'Hành lá', unit: 'g', currentStock: 5000, minStock: 1500 },
        { name: 'Rau mùi (ngò rí)', unit: 'g', currentStock: 3000, minStock: 1000 },
        { name: 'Thì là', unit: 'g', currentStock: 2000, minStock: 500 },
        { name: 'Rau răm', unit: 'g', currentStock: 2500, minStock: 500 },
        { name: 'Húng quế', unit: 'g', currentStock: 2500, minStock: 500 },
        { name: 'Chanh tươi', unit: 'quả', currentStock: 100, minStock: 20 },
        { name: 'Lá chanh tươi', unit: 'g', currentStock: 1000, minStock: 200 },

        // Nhóm 3: Rau củ quả tươi
        { name: 'Rau muống', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Cải ngọt', unit: 'g', currentStock: 12000, minStock: 3000 },
        { name: 'Bắp cải trắng', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Cà chua', unit: 'g', currentStock: 10000, minStock: 2000 },
        { name: 'Dưa chuột (dưa leo)', unit: 'g', currentStock: 8000, minStock: 2000 },
        { name: 'Khoai tây', unit: 'g', currentStock: 20000, minStock: 4000 },
        { name: 'Cà rốt', unit: 'g', currentStock: 10000, minStock: 2000 },
        { name: 'Bắp ngọt (ngô ngọt)', unit: 'bắp', currentStock: 50, minStock: 15 },
        { name: 'Nấm kim châm', unit: 'g', currentStock: 8000, minStock: 2000 },
        { name: 'Nấm rơm tươi', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Dứa (thơm)', unit: 'quả', currentStock: 30, minStock: 10 },
        { name: 'Mướp hương', unit: 'g', currentStock: 6000, minStock: 1500 },

        // Nhóm 4: Thịt nông trại gia súc
        { name: 'Thịt thăn bò', unit: 'g', currentStock: 25000, minStock: 5000 },
        { name: 'Bắp bò hoa', unit: 'g', currentStock: 15000, minStock: 4000 },
        { name: 'Ba chỉ bò Mỹ (nhập khẩu)', unit: 'g', currentStock: 30000, minStock: 6000 },
        { name: 'Thịt ba chỉ heo', unit: 'g', currentStock: 25000, minStock: 5000 },
        { name: 'Sườn non heo', unit: 'g', currentStock: 20000, minStock: 4000 },
        { name: 'Thịt nạc vai heo', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Móng giò heo', unit: 'g', currentStock: 8000, minStock: 2000 },

        // Nhóm 5: Thịt nông trại gia cầm
        { name: 'Thịt gà ta', unit: 'g', currentStock: 20000, minStock: 4000 },
        { name: 'Ức gà tươi', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Cánh gà tươi', unit: 'g', currentStock: 12000, minStock: 3000 },
        { name: 'Đùi gà tươi', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Trứng gà tươi', unit: 'quả', currentStock: 200, minStock: 50 },
        { name: 'Trứng vịt tươi', unit: 'quả', currentStock: 100, minStock: 30 },

        // Nhóm 6: Thủy hải sản tươi sống
        { name: 'Tôm sú tươi', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Mực ống tươi', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Bạch tuộc tươi', unit: 'g', currentStock: 12000, minStock: 3000 },
        { name: 'Ngao hoa (nghêu)', unit: 'g', currentStock: 20000, minStock: 5000 },
        { name: 'Hàu sữa tươi', unit: 'con', currentStock: 100, minStock: 25 },
        { name: 'Cá diêu hồng', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Cá quả (cá lóc)', unit: 'g', currentStock: 10000, minStock: 2000 },
        { name: 'Cá hồi Na Uy (nhập khẩu)', unit: 'g', currentStock: 8000, minStock: 2000 },

        // Nhóm 7: Đồ phụ liệu & Nấu kèm
        { name: 'Đậu phụ tươi', unit: 'bìa', currentStock: 100, minStock: 20 },
        { name: 'Bún tươi', unit: 'g', currentStock: 15000, minStock: 3000 },
        { name: 'Mì trứng sợi', unit: 'vắt', currentStock: 100, minStock: 20 },
        { name: 'Bơ lạt', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Phô mai Mozzarella', unit: 'g', currentStock: 8000, minStock: 2000 },

        // Nhóm 8: Nguyên liệu pha chế & Bia tươi (Đơn vị lít chuẩn)
        { name: 'Cốt trà xanh khô', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Cốt trà đào', unit: 'g', currentStock: 5000, minStock: 1000 },
        { name: 'Cà phê bột nguyên chất', unit: 'g', currentStock: 8000, minStock: 2000 },
        { name: 'Sữa đặc có đường', unit: 'lon', currentStock: 50, minStock: 10 },
        { name: 'Sữa tươi không đường', unit: 'ml', currentStock: 10000, minStock: 2000 },
        { name: 'Đường nước siro', unit: 'ml', currentStock: 15000, minStock: 3000 },
        { name: 'Siro chanh leo', unit: 'ml', currentStock: 5000, minStock: 1000 },
        { name: 'Đào ngâm đóng hộp', unit: 'hộp', currentStock: 40, minStock: 10 },
        { name: 'Bia tươi (Draft Beer)', unit: 'lít', currentStock: 100, minStock: 20 },
    ];

    const ingredientMap: Record<string, string> = {};
    for (const item of ingredientsData) {
        let ing = await prisma.ingredient.findFirst({ where: { name: item.name } });
        if (!ing) {
            ing = await prisma.ingredient.create({ data: item });
        }
        ingredientMap[item.name] = ing.id;
    }
    console.log(`  ✅ Đã đồng bộ ${ingredientsData.length} nguyên liệu kho chuẩn bếp Việt`);

    // ==========================================
    // 3. NẠP 60 MÓN ĂN & CÔNG THỨC ĐỊNH MỨC (NẾU CHƯA CÓ)
    // ==========================================
    interface MenuItemSeed {
        name: string;
        price: number;
        description: string;
        categoryName: string;
        ingredients?: { name: string; quantity: number }[];
    }

    const menuItemsData: MenuItemSeed[] = [
        // --- 1. KHAI VỊ & GỎI / NỘM (6 món) ---
        {
            name: 'Nộm bò bóp thấu hoa chuối',
            price: 75000,
            description: 'Thịt bò tái chanh trộn hoa chuối, đậu phộng rang, rau răm chua ngọt',
            categoryName: 'Khai vị & Gỏi / Nộm',
            ingredients: [
                { name: 'Thịt thăn bò', quantity: 150 },
                { name: 'Chanh tươi', quantity: 2 },
                { name: 'Rau răm', quantity: 20 },
                { name: 'Nước mắm truyền thống', quantity: 20 },
                { name: 'Đường cát trắng', quantity: 15 },
            ]
        },
        {
            name: 'Gỏi gà xé phay hành tây',
            price: 70000,
            description: 'Gà ta luộc xé sợi trộn hành tây giòn, rau răm và tiêu ớt chua ngọt',
            categoryName: 'Khai vị & Gỏi / Nộm',
            ingredients: [
                { name: 'Thịt gà ta', quantity: 200 },
                { name: 'Hành tím ta', quantity: 30 },
                { name: 'Rau răm', quantity: 20 },
                { name: 'Chanh tươi', quantity: 1 },
                { name: 'Hạt tiêu đen xay', quantity: 3 },
            ]
        },
        {
            name: 'Gỏi tôm thịt ngó sen',
            price: 80000,
            description: 'Tôm sú tươi và thịt ba chỉ luộc trộn ngó sen giòn mát chua ngọt',
            categoryName: 'Khai vị & Gỏi / Nộm',
            ingredients: [
                { name: 'Tôm sú tươi', quantity: 100 },
                { name: 'Thịt ba chỉ heo', quantity: 80 },
                { name: 'Cà rốt', quantity: 50 },
                { name: 'Rau răm', quantity: 15 },
                { name: 'Nước mắm truyền thống', quantity: 20 },
            ]
        },
        {
            name: 'Khoai tây chiên bơ tỏi',
            price: 45000,
            description: 'Khoai tây cắt que chiên giòn rụm xóc đều với bơ lạt và tỏi phi thơm',
            categoryName: 'Khai vị & Gỏi / Nộm',
            ingredients: [
                { name: 'Khoai tây', quantity: 200 },
                { name: 'Bơ lạt', quantity: 25 },
                { name: 'Tỏi củ', quantity: 15 },
                { name: 'Dầu ăn thực vật', quantity: 50 },
            ]
        },
        {
            name: 'Bánh mì bơ tỏi nướng giòn',
            price: 35000,
            description: 'Bánh mì quét bơ tỏi ngò rí nướng vàng giòn thơm lừng',
            categoryName: 'Khai vị & Gỏi / Nộm',
            ingredients: [
                { name: 'Bơ lạt', quantity: 30 },
                { name: 'Tỏi củ', quantity: 20 },
                { name: 'Rau mùi (ngò rí)', quantity: 10 },
            ]
        },
        {
            name: 'Nem hải sản phô mai chiên xù',
            price: 65000,
            description: 'Nem cuốn tôm mực kèm phô mai Mozzarella béo ngậy lăn bột chiên xù',
            categoryName: 'Khai vị & Gỏi / Nộm',
            ingredients: [
                { name: 'Tôm sú tươi', quantity: 80 },
                { name: 'Mực ống tươi', quantity: 60 },
                { name: 'Phô mai Mozzarella', quantity: 40 },
                { name: 'Bột chiên giòn', quantity: 50 },
                { name: 'Dầu ăn thực vật', quantity: 60 },
            ]
        },

        // --- 2. MÓN XÀO (6 món) ---
        {
            name: 'Thịt bò xào măng tây bơ tỏi',
            price: 135000,
            description: 'Bò mềm xào lửa lớn với măng tây xanh mướt, bơ lạt thơm lừng',
            categoryName: 'Món Xào',
            ingredients: [
                { name: 'Thịt thăn bò', quantity: 180 },
                { name: 'Bơ lạt', quantity: 20 },
                { name: 'Tỏi củ', quantity: 20 },
                { name: 'Dầu hào', quantity: 15 },
                { name: 'Dầu ăn thực vật', quantity: 20 },
            ]
        },
        {
            name: 'Mực ống xào cần tỏi ớt chuông',
            price: 145000,
            description: 'Mực ống tươi giòn ngọt xào cùng cần tây, hành tây, tỏi và tiêu đen',
            categoryName: 'Món Xào',
            ingredients: [
                { name: 'Mực ống tươi', quantity: 250 },
                { name: 'Tỏi củ', quantity: 20 },
                { name: 'Hành tím ta', quantity: 15 },
                { name: 'Dầu hào', quantity: 15 },
                { name: 'Hạt tiêu đen xay', quantity: 3 },
            ]
        },
        {
            name: 'Rau muống xào tỏi xanh giòn',
            price: 40000,
            description: 'Rau muống non nhặt sạch xào lửa to với nhiều tỏi thơm giòn',
            categoryName: 'Món Xào',
            ingredients: [
                { name: 'Rau muống', quantity: 300 },
                { name: 'Tỏi củ', quantity: 30 },
                { name: 'Dầu ăn thực vật', quantity: 30 },
                { name: 'Nước mắm truyền thống', quantity: 10 },
                { name: 'Hạt nêm thịt heo', quantity: 5 },
            ]
        },
        {
            name: 'Bò lúc lắc khoai tây áp chảo',
            price: 130000,
            description: 'Thịt bò cắt vuông vắn ướp xì dầu dầu hào xào cùng ớt chuông, khoai chiên',
            categoryName: 'Món Xào',
            ingredients: [
                { name: 'Thịt thăn bò', quantity: 180 },
                { name: 'Khoai tây', quantity: 100 },
                { name: 'Nước tương (xì dầu)', quantity: 15 },
                { name: 'Dầu hào', quantity: 15 },
                { name: 'Bơ lạt', quantity: 15 },
            ]
        },
        {
            name: 'Bạch tuộc xào sa tế cay giòn',
            price: 125000,
            description: 'Bạch tuộc tươi giòn sần sật sốt sa tế tôm cay nồng đậm vị',
            categoryName: 'Món Xào',
            ingredients: [
                { name: 'Bạch tuộc tươi', quantity: 250 },
                { name: 'Sa tế tôm', quantity: 25 },
                { name: 'Sả cây tươi', quantity: 20 },
                { name: 'Tỏi củ', quantity: 15 },
                { name: 'Ớt cay tươi', quantity: 10 },
            ]
        },
        {
            name: 'Mì xào giòn hải sản rau củ',
            price: 95000,
            description: 'Mì trứng chiên phồng phủ sốt hải sản tôm mực và rau củ xào đậm đà',
            categoryName: 'Món Xào',
            ingredients: [
                { name: 'Mì trứng sợi', quantity: 2 },
                { name: 'Tôm sú tươi', quantity: 80 },
                { name: 'Mực ống tươi', quantity: 80 },
                { name: 'Cải ngọt', quantity: 80 },
                { name: 'Cà rốt', quantity: 40 },
                { name: 'Dầu hào', quantity: 15 },
            ]
        },

        // --- 3. MÓN CHIÊN & RÁN (5 món) ---
        {
            name: 'Cánh gà chiên nước mắm tỏi ớt',
            price: 85000,
            description: 'Cánh gà vàng giòn rim quyện sốt nước mắm tỏi ớt mặn ngọt đưa cơm',
            categoryName: 'Món Chiên & Rán',
            ingredients: [
                { name: 'Cánh gà tươi', quantity: 300 },
                { name: 'Nước mắm truyền thống', quantity: 25 },
                { name: 'Đường cát trắng', quantity: 20 },
                { name: 'Tỏi củ', quantity: 20 },
                { name: 'Ớt cay tươi', quantity: 10 },
                { name: 'Dầu ăn thực vật', quantity: 60 },
            ]
        },
        {
            name: 'Đùi gà chiên giòn sốt cay ngọt',
            price: 85000,
            description: 'Đùi gà tẩm bột chiên vàng giòn rụm phủ sốt tương ớt cay ngọt',
            categoryName: 'Món Chiên & Rán',
            ingredients: [
                { name: 'Đùi gà tươi', quantity: 300 },
                { name: 'Bột chiên giòn', quantity: 60 },
                { name: 'Tương ớt', quantity: 30 },
                { name: 'Tỏi củ', quantity: 15 },
                { name: 'Dầu ăn thực vật', quantity: 70 },
            ]
        },
        {
            name: 'Tôm chiên hoàng bào sốt bơ',
            price: 160000,
            description: 'Tôm sú bọc sợi khoai tây chiên vàng giòn ăn cùng sốt bơ trứng béo ngậy',
            categoryName: 'Món Chiên & Rán',
            ingredients: [
                { name: 'Tôm sú tươi', quantity: 250 },
                { name: 'Khoai tây', quantity: 120 },
                { name: 'Bột chiên giòn', quantity: 40 },
                { name: 'Bơ lạt', quantity: 25 },
                { name: 'Dầu ăn thực vật', quantity: 80 },
            ]
        },
        {
            name: 'Ba chỉ heo chiên giòn bì sốt me',
            price: 115000,
            description: 'Thịt ba chỉ luộc sơ rồi chiên nổ cốm giòn tan chấm sốt me chua cay',
            categoryName: 'Món Chiên & Rán',
            ingredients: [
                { name: 'Thịt ba chỉ heo', quantity: 250 },
                { name: 'Giấm gạo', quantity: 15 },
                { name: 'Muối tinh', quantity: 5 },
                { name: 'Ớt cay tươi', quantity: 10 },
                { name: 'Dầu ăn thực vật', quantity: 70 },
            ]
        },
        {
            name: 'Đậu phụ tẩm hành chiên giòn',
            price: 45000,
            description: 'Đậu phụ làng Mơ rán vàng giòn nhúng mỡ hành béo ngậy thơm nức',
            categoryName: 'Món Chiên & Rán',
            ingredients: [
                { name: 'Đậu phụ tươi', quantity: 3 },
                { name: 'Hành lá', quantity: 40 },
                { name: 'Nước mắm truyền thống', quantity: 20 },
                { name: 'Dầu ăn thực vật', quantity: 50 },
            ]
        },

        // --- 4. MÓN NƯỚNG (5 món) ---
        {
            name: 'Sườn non heo nướng mật ong',
            price: 150000,
            description: 'Sườn non heo chặt dẻ ướp sốt mật ong, hành tỏi, ngũ vị hương nướng than hoa',
            categoryName: 'Món Nướng',
            ingredients: [
                { name: 'Sườn non heo', quantity: 350 },
                { name: 'Ngũ vị hương', quantity: 1 },
                { name: 'Hành tím ta', quantity: 20 },
                { name: 'Tỏi củ', quantity: 20 },
                { name: 'Dầu hào', quantity: 15 },
            ]
        },
        {
            name: 'Bò nướng tảng sốt tiêu đen',
            price: 185000,
            description: 'Bò thăn nướng tảng nguyên bản xém cạnh ăn kèm sốt tiêu đen thơm nồng',
            categoryName: 'Món Nướng',
            ingredients: [
                { name: 'Thịt thăn bò', quantity: 250 },
                { name: 'Hạt tiêu đen xay', quantity: 10 },
                { name: 'Bơ lạt', quantity: 20 },
                { name: 'Tỏi củ', quantity: 15 },
                { name: 'Dầu hào', quantity: 15 },
            ]
        },
        {
            name: 'Tôm sú nướng muối ớt xiêm xanh',
            price: 175000,
            description: 'Tôm sú tươi sống xiên que nướng vàng rộm chấm muối ớt xanh chua cay',
            categoryName: 'Món Nướng',
            ingredients: [
                { name: 'Tôm sú tươi', quantity: 300 },
                { name: 'Ớt cay tươi', quantity: 20 },
                { name: 'Muối tinh', quantity: 10 },
                { name: 'Chanh tươi', quantity: 1 },
            ]
        },
        {
            name: 'Hàu sữa nướng mỡ hành đậu phộng',
            price: 110000,
            description: 'Set 6 con hàu sữa béo ngậy nướng mỡ hành hoa và lạc rang giòn',
            categoryName: 'Món Nướng',
            ingredients: [
                { name: 'Hàu sữa tươi', quantity: 6 },
                { name: 'Hành lá', quantity: 40 },
                { name: 'Dầu ăn thực vật', quantity: 30 },
                { name: 'Hạt nêm thịt heo', quantity: 5 },
            ]
        },
        {
            name: 'Hàu sữa nướng phô mai bỏ lò',
            price: 120000,
            description: 'Set 6 con hàu sữa phủ đẫm phô mai Mozzarella nướng kéo sợi',
            categoryName: 'Món Nướng',
            ingredients: [
                { name: 'Hàu sữa tươi', quantity: 6 },
                { name: 'Phô mai Mozzarella', quantity: 60 },
                { name: 'Sữa tươi không đường', quantity: 20 },
                { name: 'Bơ lạt', quantity: 15 },
            ]
        },

        // --- 5. MÓN HẤP & LUỘC (4 món) ---
        {
            name: 'Gà ta hấp lá chanh tiêu ớt',
            price: 180000,
            description: 'Nửa con gà ta hoa mơ hấp cách thủy da vàng ươm, thịt ngọt thơm lừng lá chanh',
            categoryName: 'Món Hấp & Luộc',
            ingredients: [
                { name: 'Thịt gà ta', quantity: 600 },
                { name: 'Lá chanh tươi', quantity: 15 },
                { name: 'Gừng già', quantity: 20 },
                { name: 'Hạt tiêu đen xay', quantity: 5 },
                { name: 'Muối tinh', quantity: 10 },
                { name: 'Chanh tươi', quantity: 1 },
            ]
        },
        {
            name: 'Mực ống hấp gừng sả ớt hiểm',
            price: 150000,
            description: 'Mực ống tươi hấp chín tới cùng gừng sợi, sả đập dập chấm nước mắm gừng',
            categoryName: 'Món Hấp & Luộc',
            ingredients: [
                { name: 'Mực ống tươi', quantity: 300 },
                { name: 'Gừng già', quantity: 30 },
                { name: 'Sả cây tươi', quantity: 30 },
                { name: 'Ớt cay tươi', quantity: 10 },
                { name: 'Nước mắm truyền thống', quantity: 20 },
            ]
        },
        {
            name: 'Ngao hoa hấp sả ớt nước dừa',
            price: 85000,
            description: 'Ngao hoa béo múp hấp sả thơm và nước dừa thanh ngọt nóng hổi',
            categoryName: 'Món Hấp & Luộc',
            ingredients: [
                { name: 'Ngao hoa (nghêu)', quantity: 500 },
                { name: 'Sả cây tươi', quantity: 40 },
                { name: 'Ớt cay tươi', quantity: 10 },
                { name: 'Rau răm', quantity: 15 },
            ]
        },
        {
            name: 'Thịt ba chỉ luộc chấm mắm tôm',
            price: 110000,
            description: 'Ba chỉ heo luộc thái mỏng giòn sần sật ăn kèm dưa chuột, rau thơm',
            categoryName: 'Món Hấp & Luộc',
            ingredients: [
                { name: 'Thịt ba chỉ heo', quantity: 300 },
                { name: 'Hành tím ta', quantity: 20 },
                { name: 'Dưa chuột (dưa leo)', quantity: 100 },
                { name: 'Rau mùi (ngò rí)', quantity: 20 },
                { name: 'Ớt cay tươi', quantity: 5 },
            ]
        },

        // --- 6. MÓN KHO & OM (4 món) ---
        {
            name: 'Thịt ba chỉ kho trứng cút',
            price: 110000,
            description: 'Thịt ba chỉ xắt con chì kho mềm rục nước dừa quyện trứng cút bùi béo',
            categoryName: 'Món Kho & Om',
            ingredients: [
                { name: 'Thịt ba chỉ heo', quantity: 250 },
                { name: 'Trứng gà tươi', quantity: 3 },
                { name: 'Nước mắm truyền thống', quantity: 30 },
                { name: 'Đường cát trắng', quantity: 20 },
                { name: 'Hành tím ta', quantity: 20 },
                { name: 'Hạt tiêu đen xay', quantity: 5 },
            ]
        },
        {
            name: 'Sườn heo rim mặn ngọt',
            price: 125000,
            description: 'Sườn non heo chiên sơ rồi rim sốt mắm đường tỏi ớt sánh nâu óng ả',
            categoryName: 'Món Kho & Om',
            ingredients: [
                { name: 'Sườn non heo', quantity: 300 },
                { name: 'Nước mắm truyền thống', quantity: 25 },
                { name: 'Đường cát trắng', quantity: 20 },
                { name: 'Tỏi củ', quantity: 15 },
                { name: 'Hành tím ta', quantity: 15 },
            ]
        },
        {
            name: 'Cá quả kho tộ tiêu xanh',
            price: 140000,
            description: 'Cá quả đồng cắt khúc kho niêu đất với riềng, thịt mỡ và tiêu đen đậm đà',
            categoryName: 'Món Kho & Om',
            ingredients: [
                { name: 'Cá quả (cá lóc)', quantity: 350 },
                { name: 'Riềng tươi', quantity: 30 },
                { name: 'Hạt tiêu đen xay', quantity: 10 },
                { name: 'Nước mắm truyền thống', quantity: 30 },
                { name: 'Đường cát trắng', quantity: 20 },
            ]
        },
        {
            name: 'Ba chỉ om chuối đậu tía tô',
            price: 135000,
            description: 'Thịt ba chỉ xém cạnh om cùng chuối xanh, đậu phụ vàng ươm và lá tía tô',
            categoryName: 'Món Kho & Om',
            ingredients: [
                { name: 'Thịt ba chỉ heo', quantity: 200 },
                { name: 'Đậu phụ tươi', quantity: 2 },
                { name: 'Nghệ tươi', quantity: 20 },
                { name: 'Hành tím ta', quantity: 15 },
            ]
        },

        // --- 7. MÓN CANH & LẨU (10 món) ---
        {
            name: 'Set Lẩu Thái Tomyum hải sản chua cay',
            price: 349000,
            description: 'Nước lẩu Tomyum cốt dừa chua cay, tôm sú, mực ống, ngao, nấm kim châm và rau muống',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Tôm sú tươi', quantity: 200 },
                { name: 'Mực ống tươi', quantity: 200 },
                { name: 'Ngao hoa (nghêu)', quantity: 300 },
                { name: 'Nấm kim châm', quantity: 150 },
                { name: 'Rau muống', quantity: 200 },
                { name: 'Mì trứng sợi', quantity: 3 },
                { name: 'Sả cây tươi', quantity: 50 },
            ]
        },
        {
            name: 'Set Lẩu riêu cua bắp bò sườn sụn',
            price: 369000,
            description: 'Nước lẩu riêu cua đồng thanh mát, bắp bò hoa giòn sần sật, sườn sụn và đậu rán',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Bắp bò hoa', quantity: 250 },
                { name: 'Sườn non heo', quantity: 200 },
                { name: 'Đậu phụ tươi', quantity: 2 },
                { name: 'Cà chua', quantity: 100 },
                { name: 'Bún tươi', quantity: 300 },
                { name: 'Hành lá', quantity: 30 },
            ]
        },
        {
            name: 'Set Lẩu nấm gà ta thảo mộc thanh ngọt',
            price: 329000,
            description: 'Gà ta nấu cùng nấm kim châm, nấm rơm, kỷ tử táo đỏ thanh mát bổ dưỡng',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Thịt gà ta', quantity: 500 },
                { name: 'Nấm kim châm', quantity: 150 },
                { name: 'Nấm rơm tươi', quantity: 100 },
                { name: 'Bắp ngọt (ngô ngọt)', quantity: 1 },
                { name: 'Mì trứng sợi', quantity: 3 },
            ]
        },
        {
            name: 'Set Lẩu cá diêu hồng nấu măng chua',
            price: 299000,
            description: 'Cá diêu hồng tươi phi lê nấu măng chua, dứa, cà chua và rau thì là thơm lừng',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Cá diêu hồng', quantity: 600 },
                { name: 'Cà chua', quantity: 100 },
                { name: 'Dứa (thơm)', quantity: 1 },
                { name: 'Thì là', quantity: 30 },
                { name: 'Bún tươi', quantity: 300 },
            ]
        },
        {
            name: 'Set Lẩu kim chi ba chỉ bò chua cay',
            price: 319000,
            description: 'Ba chỉ bò Mỹ thái lát cuộn nấm kim châm nhúng nước lẩu kim chi đậm đà',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Ba chỉ bò Mỹ (nhập khẩu)', quantity: 350 },
                { name: 'Nấm kim châm', quantity: 150 },
                { name: 'Đậu phụ tươi', quantity: 2 },
                { name: 'Mì trứng sợi', quantity: 3 },
            ]
        },
        {
            name: 'Set Nướng Thịt Bò Hảo Hạng kèm nấm',
            price: 380000,
            description: 'Thăn bò ướp sốt tiêu và ba chỉ bò Mỹ cuộn nấm kim châm nướng bơ tỏi',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Thịt thăn bò', quantity: 200 },
                { name: 'Ba chỉ bò Mỹ (nhập khẩu)', quantity: 250 },
                { name: 'Nấm kim châm', quantity: 150 },
                { name: 'Bơ lạt', quantity: 30 },
            ]
        },
        {
            name: 'Set Nướng Ba Chỉ Heo & Nạc Vai ngũ vị',
            price: 280000,
            description: 'Thịt ba chỉ heo dầy dặn và nạc vai ướp sốt ngũ vị nướng cháy cạnh thơm lừng',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Thịt ba chỉ heo', quantity: 250 },
                { name: 'Thịt nạc vai heo', quantity: 250 },
                { name: 'Ngũ vị hương', quantity: 1 },
                { name: 'Dầu hào', quantity: 20 },
            ]
        },
        {
            name: 'Set Nướng Hải Sản Tổng Hợp bơ tỏi',
            price: 420000,
            description: 'Tôm sú tươi, mực ống khía hoa, bạch tuộc và hàu nướng mỡ hành tại bàn',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Tôm sú tươi', quantity: 200 },
                { name: 'Mực ống tươi', quantity: 200 },
                { name: 'Bạch tuộc tươi', quantity: 150 },
                { name: 'Hàu sữa tươi', quantity: 4 },
                { name: 'Bơ lạt', quantity: 30 },
            ]
        },
        {
            name: 'Combo Nướng Lẩu Gia Đình 4-6 người',
            price: 650000,
            description: 'Đại tiệc gồm 1 set nướng bò heo tổng hợp và 1 nồi lẩu Thái hải sản kèm mì bún',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Ba chỉ bò Mỹ (nhập khẩu)', quantity: 300 },
                { name: 'Thịt ba chỉ heo', quantity: 200 },
                { name: 'Tôm sú tươi', quantity: 200 },
                { name: 'Mực ống tươi', quantity: 200 },
                { name: 'Nấm kim châm', quantity: 200 },
                { name: 'Rau muống', quantity: 300 },
                { name: 'Bún tươi', quantity: 400 },
            ]
        },
        {
            name: 'Set Nướng VIP Bò & Hải Sản thượng hạng',
            price: 850000,
            description: 'Thăn bò hảo hạng, cá hồi Na Uy, tôm sú loại 1 và hàu phô mai sang trọng',
            categoryName: 'Món Canh & Lẩu',
            ingredients: [
                { name: 'Thịt thăn bò', quantity: 300 },
                { name: 'Cá hồi Na Uy (nhập khẩu)', quantity: 200 },
                { name: 'Tôm sú tươi', quantity: 250 },
                { name: 'Hàu sữa tươi', quantity: 6 },
                { name: 'Phô mai Mozzarella', quantity: 60 },
            ]
        },

        // --- 8. ĐỒ UỐNG & BIA (16 món) ---
        {
            name: 'Trà đào cam sả thanh nhiệt',
            price: 45000,
            description: 'Trà đào ủ lạnh kết hợp cam tươi mọng nước, sả thơm và 2 miếng đào giòn',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Cốt trà đào', quantity: 20 },
                { name: 'Sả cây tươi', quantity: 15 },
                { name: 'Đường nước siro', quantity: 30 },
                { name: 'Đào ngâm đóng hộp', quantity: 1 },
            ]
        },
        {
            name: 'Trà chanh mật ong hoa đậu biếc',
            price: 35000,
            description: 'Trà chanh truyền thống biến tấu cùng sắc xanh hoa đậu biếc và mật ong',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Cốt trà xanh khô', quantity: 15 },
                { name: 'Chanh tươi', quantity: 1 },
                { name: 'Đường nước siro', quantity: 30 },
            ]
        },
        {
            name: 'Trà dâu tây tuyết nhĩ',
            price: 42000,
            description: 'Trà hoa quả chua ngọt dịu mát từ dâu tây tươi và thạch tuyết nhĩ',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Cốt trà xanh khô', quantity: 15 },
                { name: 'Đường nước siro', quantity: 30 },
            ]
        },
        {
            name: 'Trà tắc sả gừng tươi',
            price: 32000,
            description: 'Vị chua của quất tươi kết hợp hương cay ấm của gừng và sả đập dập',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Cốt trà xanh khô', quantity: 15 },
                { name: 'Gừng già', quantity: 15 },
                { name: 'Sả cây tươi', quantity: 15 },
                { name: 'Đường nước siro', quantity: 25 },
            ]
        },
        {
            name: 'Cà phê đen đá truyền thống',
            price: 30000,
            description: 'Cà phê Robusta pha phin đậm đà thơm nồng nàn vị đắng mộc',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Cà phê bột nguyên chất', quantity: 25 },
                { name: 'Đường cát trắng', quantity: 10 },
            ]
        },
        {
            name: 'Cà phê sữa đá Sài Gòn',
            price: 35000,
            description: 'Cà phê phin hòa quyện cùng sữa đặc béo ngậy ngọt ngào',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Cà phê bột nguyên chất', quantity: 25 },
                { name: 'Sữa đặc có đường', quantity: 1 },
            ]
        },
        {
            name: 'Nước chanh tươi đá đường',
            price: 28000,
            description: 'Chanh tươi vắt nguyên chất giải nhiệt mùa hè',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Chanh tươi', quantity: 2 },
                { name: 'Đường cát trắng', quantity: 25 },
            ]
        },
        {
            name: 'Nước ép dưa hấu tươi mát',
            price: 35000,
            description: '100% dưa hấu tươi nguyên chất ép lạnh ngọt thanh',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Đường nước siro', quantity: 15 },
            ]
        },
        {
            name: 'Nước cam tươi nguyên chất',
            price: 42000,
            description: 'Cam sành tươi vắt tay nhiều tép cam mọng nước giàu vitamin C',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Đường cát trắng', quantity: 20 },
            ]
        },
        {
            name: 'Sinh tố bơ dừa tươi',
            price: 45000,
            description: 'Bơ sáp béo ngậy xay nhuyễn cùng nước cốt dừa và sữa tươi',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Sữa tươi không đường', quantity: 60 },
                { name: 'Sữa đặc có đường', quantity: 1 },
            ]
        },
        // Đồ uống bia tươi (trừ kho theo Lít)
        {
            name: 'Ly bia tươi lạnh 330ml',
            price: 25000,
            description: 'Bia tươi hơi rót từ vòi mát lạnh, bọt mịn sánh xốp (Ly 330ml)',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Bia tươi (Draft Beer)', quantity: 0.33 },
            ]
        },
        {
            name: 'Ca bia tươi 1 Lít',
            price: 65000,
            description: 'Ca bia tươi rót trực tiếp dung tích 1 Lít cho bàn nhậu',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Bia tươi (Draft Beer)', quantity: 1.0 },
            ]
        },
        {
            name: 'Tháp bia tươi 3 Lít',
            price: 180000,
            description: 'Tháp bia tươi có lõi giữ lạnh dung tích 3 Lít cực đã',
            categoryName: 'Đồ Uống & Bia',
            ingredients: [
                { name: 'Bia tươi (Draft Beer)', quantity: 3.0 },
            ]
        },
        // Đồ đóng lon bán trực tiếp
        {
            name: 'Nước ngọt Coca Cola lon 330ml',
            price: 20000,
            description: 'Nước ngọt có ga Coca Cola lon ướp lạnh',
            categoryName: 'Đồ Uống & Bia',
        },
        {
            name: 'Nước ngọt 7Up lon 330ml',
            price: 20000,
            description: 'Nước ngọt có ga vị chanh 7Up lon mát lạnh',
            categoryName: 'Đồ Uống & Bia',
        },
        {
            name: 'Nước suối tinh khiết Aquafina 500ml',
            price: 15000,
            description: 'Nước uống đóng chai tinh khiết Aquafina 500ml',
            categoryName: 'Đồ Uống & Bia',
        },

        // --- 9. MÓN TRÁNG MIỆNG (4 món) ---
        {
            name: 'Chè khúc bạch long nhãn hạt chia',
            price: 38000,
            description: 'Khúc bạch phô mai mềm mịn, long nhãn giòn ngọt nước đường phèn hạnh nhân',
            categoryName: 'Món Tráng Miệng',
            ingredients: [
                { name: 'Sữa tươi không đường', quantity: 50 },
                { name: 'Đường cát trắng', quantity: 20 },
            ]
        },
        {
            name: 'Chè hạt sen long nhãn thanh mát',
            price: 35000,
            description: 'Hạt sen bùi thơm lồng long nhãn ngọt thanh mát bổ dưỡng',
            categoryName: 'Món Tráng Miệng',
            ingredients: [
                { name: 'Đường cát trắng', quantity: 20 },
            ]
        },
        {
            name: 'Đĩa hoa quả tươi thập cẩm theo mùa',
            price: 60000,
            description: 'Dưa hấu, ổi, thanh long, dứa thái lát tươi mát kèm muối chấm cay',
            categoryName: 'Món Tráng Miệng',
            ingredients: [
                { name: 'Dưa chuột (dưa leo)', quantity: 100 },
                { name: 'Muối tinh', quantity: 10 },
            ]
        },
        {
            name: 'Kem tươi vani sốt socola',
            price: 30000,
            description: '2 viên kem vani Pháp béo ngậy rưới sốt socola Bỉ đậm đà',
            categoryName: 'Món Tráng Miệng',
            ingredients: [
                { name: 'Sữa tươi không đường', quantity: 40 },
                { name: 'Sữa đặc có đường', quantity: 1 },
            ]
        },
    ];

    let newItemsCount = 0;
    let newRecipesCount = 0;
    for (const item of menuItemsData) {
        const { ingredients, categoryName, ...menuItemFields } = item;
        const categoryId = categoryMap[categoryName];

        let menuItem = await prisma.menuItem.findFirst({ where: { name: item.name } });
        if (!menuItem) {
            menuItem = await prisma.menuItem.create({
                data: {
                    ...menuItemFields,
                    categoryId,
                }
            });
            newItemsCount++;

            if (ingredients && ingredients.length > 0) {
                for (const ing of ingredients) {
                    const ingredientId = ingredientMap[ing.name];
                    if (ingredientId) {
                        await prisma.menuItemIngredient.create({
                            data: {
                                menuItemId: menuItem.id,
                                ingredientId,
                                quantity: ing.quantity,
                            }
                        });
                        newRecipesCount++;
                    }
                }
            }
        }
    }

    console.log(`  ✅ Đã bổ sung ${newItemsCount} món ăn mới (Tổng số món dự kiến: 60)`);
    console.log(`  ✅ Đã bổ sung ${newRecipesCount} công thức định mức trừ kho`);
    console.log('🎉 [GÓI 1 - BỔ SUNG] Hoàn tất nạp dữ liệu Bếp & Thực đơn thành công!\n');
}

// Chạy trực tiếp độc lập khi gọi file này
const prismaInstance = new PrismaClient();
seedGoi1BepVaThucDon(prismaInstance)
    .catch((e) => {
        console.error('❌ Lỗi khi chạy Gói 1:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prismaInstance.$disconnect();
    });
