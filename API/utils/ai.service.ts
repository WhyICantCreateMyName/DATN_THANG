import { GoogleGenerativeAI } from "@google/generative-ai";

export interface SuggestedIngredient {
    name: string;
    quantity: number;
    unit: string;
}

/**
 * Gửi yêu cầu tới Gemini để gợi ý công thức món ăn
 * @param dishName Tên món ăn
 * @param existingIngredients Danh sách tên nguyên liệu đang có trong kho
 */
export async function getRecipeSuggestionFromAI(dishName: string, existingIngredients: string[] = []): Promise<SuggestedIngredient[]> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is missing in .env file!");
            return [];
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const prompt = `
            Bạn là một chuyên gia ẩm thực và đầu bếp chuyên nghiệp tại Việt Nam.
            Hãy gợi ý công thức định mức nguyên liệu thô cho món ăn: "${dishName}".
            
            DANH SÁCH NGUYÊN LIỆU ĐANG CÓ TRONG KHO:
            ${existingIngredients.length > 0 ? existingIngredients.join(', ') : 'Chưa có dữ liệu'}

            YÊU CẦU QUAN TRỌNG:
            1. ƯU TIÊN SỬ DỤNG TÊN TRONG DANH SÁCH CÓ SẴN: Nếu nguyên liệu cần thiết đã có tên tương tự trong danh sách trên, hãy sử dụng CHÍNH XÁC tên đó.
               (Ví dụ: Nếu trong kho có "Thịt bò" mà món ăn cần thịt bò, đừng gợi ý "Thịt bò thăn Úc", hãy dùng "Thịt bò").
            2. NỘI ĐỊA HÓA: Sử dụng tên gọi phổ thông nhất của Việt Nam cho các nguyên liệu mới (Ví dụ: "Hành tím", "Tỏi", "Nước mắm"...).
            3. ĐƠN VỊ: Luôn dùng đơn vị nhỏ nhất là "g" (gram) hoặc "ml". KHÔNG dùng "kg", "lít".
            4. ĐỊNH DẠNG: Trả về DUY NHẤT một mảng JSON:
            [
                {"name": "Tên nguyên liệu", "quantity": 150, "unit": "g"},
                {"name": "Tên nguyên liệu 2", "quantity": 20, "unit": "ml"}
            ]
            5. Số lượng là ước tính cho 1 SUẤT ĂN đơn lẻ.
            
            Lưu ý: Không viết lời dẫn, chỉ trả về JSON.
        `;

        // Sử dụng bản 2.5 Flash tiêu chuẩn của năm 2026
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);

        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error("AI không trả về định dạng JSON hợp lệ");
    } catch (error: any) {
        console.error("Lỗi AI Service:", error.message || error);
        return [];
    }
}
