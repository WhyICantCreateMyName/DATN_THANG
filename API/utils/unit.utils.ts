/**
 * Chuẩn hoá đơn vị đo lường về dạng viết tắt chuẩn
 */
export function normalizeUnit(unit: string): string {
    const u = unit.toLowerCase().trim();
    
    // Nhóm Khối lượng
    if (['kg', 'kilogram', 'kilo', 'cân', 'ký'].includes(u)) return 'kg';
    if (['g', 'gram', 'gam', 'gr'].includes(u)) return 'g';
    
    // Nhóm Thể tích
    if (['l', 'lít', 'lit', 'liter'].includes(u)) return 'l';
    if (['ml', 'mililit', 'milliliter'].includes(u)) return 'ml';
    
    // Nhóm Số lượng
    if (['cái', 'chiếc'].includes(u)) return 'cái';
    if (['chai', 'lo'].includes(u)) return 'chai';
    
    return u; // Giữ nguyên nếu không khớp
}

/**
 * Tính toán tỷ lệ quy đổi giữa 2 đơn vị
 * Ví dụ: từ 'g' sang 'kg' trả về 0.001
 */
export function getUnitConversionFactor(fromUnit: string, toUnit: string): number {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);

    if (from === to) return 1;

    // Khối lượng
    if (from === 'g' && to === 'kg') return 0.001;
    if (from === 'kg' && to === 'g') return 1000;

    // Thể tích
    if (from === 'ml' && to === 'l') return 0.001;
    if (from === 'l' && to === 'ml') return 1000;

    return 1; // Không quy đổi được thì giữ nguyên tỷ lệ 1:1
}
