import React, { useState, useEffect } from 'react';
import { X, Scale, Sparkles, Plus, Trash2, Check, Loader2, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { MenuItem } from '@/services/menu.service';
import { ingredientService, Ingredient } from '@/services/ingredient.service';

// Hàm chuẩn hoá đơn vị ở Frontend để so khớp với AI
const normalizeUnit = (unit: string): string => {
    const u = unit?.toLowerCase().trim() || '';
    if (['kg', 'kilogram', 'kilo', 'cân', 'ký'].includes(u)) return 'kg';
    if (['g', 'gram', 'gam', 'gr'].includes(u)) return 'g';
    if (['l', 'lít', 'lit', 'liter'].includes(u)) return 'l';
    if (['ml', 'mililit', 'milliliter'].includes(u)) return 'ml';
    if (['quả', 'trái', 'cái', 'chiếc'].includes(u)) return 'quả';
    if (['lọ', 'chai', 'hũ', 'bình'].includes(u)) return 'lọ';
    if (['bịch', 'gói', 'túi'].includes(u)) return 'bịch';
    if (['thùng', 'két', 'kiện'].includes(u)) return 'thùng';
    if (['hộp', 'lon', 'pack'].includes(u)) return 'hộp';
    return u;
};

interface RecipeItem {
    id: string;
    menuItemId: string;
    ingredientId: string;
    quantity: number;
    ingredient: Ingredient;
}

interface RecipeModalProps {
    menuItem: MenuItem;
    onClose: () => void;
}

export default function RecipeModal({ menuItem, onClose }: RecipeModalProps) {
    const [recipe, setRecipe] = useState<RecipeItem[]>([]);
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [unmatchedSuggestions, setUnmatchedSuggestions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState<string>('');
    const [selectedIngId, setSelectedIngId] = useState<string>('');

    // Load dữ liệu
    useEffect(() => {
        fetchData();
    }, [menuItem.id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [recipeRes, ingredientsRes] = await Promise.all([
                axios.get(`http://localhost:4000/recipes/${menuItem.id}`),
                ingredientService.getAllIngredients(1, 1000) // Lấy nhiều để tìm kiếm
            ]);
            setRecipe(recipeRes.data);
            setAllIngredients(ingredientsRes.data || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu công thức:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddManual = async () => {
        if (!selectedIngId || !quantity) return;
        try {
            await axios.post('http://localhost:4000/recipes', {
                menuItemId: menuItem.id,
                ingredientId: selectedIngId,
                quantity: parseFloat(quantity)
            });
            fetchData();
            setQuantity('');
            setSelectedIngId('');
        } catch (error) {
            alert('Lỗi khi thêm nguyên liệu');
        }
    };

    const handleDelete = async (ingId: string) => {
        try {
            await axios.delete(`http://localhost:4000/recipes/${menuItem.id}/${ingId}`);
            fetchData();
        } catch (error) {
            alert('Lỗi khi xóa nguyên liệu');
        }
    };

    // --- LOGIC AI SUGGESTION ---
    const handleAiSuggest = async () => {
        if (!confirm('AI sẽ gợi ý công thức dựa trên tên món ăn. Bạn có muốn tiếp tục?')) return;

        setIsAiLoading(true);
        try {
            // 1. Gọi API gợi ý từ AI
            const res = await axios.get(`http://localhost:4000/recipes/suggest?menuItemName=${encodeURIComponent(menuItem.name)}`);
            const suggestions = res.data; // Mảng: {name, quantity, unit}

            if (!suggestions || suggestions.length === 0) {
                alert('AI không thể đưa ra gợi ý cho món này.');
                return;
            }

            // 2. Tìm kiếm ID nguyên liệu khớp với tên AI gợi ý trong DB của mình
            let matchedCount = 0;
            const unmatched = [];

            for (const suggest of suggestions) {
                const match = allIngredients.find(ing =>
                    ing.name.toLowerCase().includes(suggest.name.toLowerCase()) ||
                    suggest.name.toLowerCase().includes(ing.name.toLowerCase())
                );

                if (match) {
                    // Logic quy đổi đơn vị chuẩn hoá
                    const dbUnit = normalizeUnit(match.unit);
                    const aiUnit = normalizeUnit(suggest.unit);

                    let finalQty = suggest.quantity;

                    // Quy đổi G/ML sang KG/L nếu cần
                    if ((dbUnit === 'kg' && aiUnit === 'g') || (dbUnit === 'l' && aiUnit === 'ml')) {
                        finalQty = suggest.quantity / 1000;
                    }

                    await axios.post('http://localhost:4000/recipes', {
                        menuItemId: menuItem.id,
                        ingredientId: match.id,
                        quantity: finalQty
                    });
                    matchedCount++;
                } else {
                    unmatched.push(suggest);
                }
            }

            setUnmatchedSuggestions(unmatched);
            if (unmatched.length === 0) {
                alert(`Tuyệt vời! AI đã khớp được toàn bộ ${matchedCount} nguyên liệu.`);
            } else {
                alert(`AI đã khớp được ${matchedCount} nguyên liệu. Có ${unmatched.length} nguyên liệu mới cần bạn xác nhận.`);
            }
            fetchData();
        } catch (error) {
            alert('Lỗi khi gọi AI gợi ý');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleQuickAddMissing = async () => {
        setIsLoading(true);
        try {
            for (const item of unmatchedSuggestions) {
                // 1. Tạo nguyên liệu mới vào kho
                const newIng = await ingredientService.createIngredient({
                    name: item.name,
                    unit: normalizeUnit(item.unit || 'g'), // Chuẩn hoá khi tạo mới
                    currentStock: 0,
                    minStock: 5
                });

                // 2. Thêm vào định mức (Tạo mới thì dùng luôn đơn vị AI gợi ý)
                await axios.post('http://localhost:4000/recipes', {
                    menuItemId: menuItem.id,
                    ingredientId: newIng.id,
                    quantity: item.quantity
                });
            }
            setUnmatchedSuggestions([]);
            fetchData();
            alert('Đã tạo mới và thêm toàn bộ nguyên liệu vào kho!');
        } catch (error) {
            alert('Lỗi khi tạo nhanh nguyên liệu');
        } finally {
            setIsLoading(false);
        }
    };

    console.log(allIngredients);
    const filteredIngredients = allIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !recipe.some(r => r.ingredientId === ing.id)
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-2xl">
                            <Scale className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Định mức Nguyên liệu</h3>
                            <p className="text-xs text-gray-500">Thiết lập công thức cho món: <span className="text-purple-600 font-bold uppercase">{menuItem.name}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* AI Suggest Button */}
                    <div className="space-y-4">
                        <button
                            onClick={handleAiSuggest}
                            disabled={isAiLoading}
                            className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-bold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-indigo-500/30 transition-all group disabled:opacity-50"
                        >
                            {isAiLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                            )}
                            {isAiLoading ? 'AI ĐANG SUY NGHĨ...' : 'GỢI Ý CÔNG THỨC THÔNG MINH BẰNG AI'}
                        </button>

                        {/* Danh sách chưa khớp - Hiện ra khi AI gợi ý cái mới */}
                        {unmatchedSuggestions.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Nguyên liệu mới (Chưa có trong kho)
                                    </h4>
                                    <button
                                        onClick={handleQuickAddMissing}
                                        className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded-full font-bold hover:bg-amber-700 transition-all"
                                    >
                                        TẠO NHANH & THÊM TẤT CẢ
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {unmatchedSuggestions.map((item, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white border border-amber-100 rounded-lg text-[10px] font-medium text-amber-700">
                                            {item.name}: {item.quantity}{item.unit}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thêm thủ công */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Thêm nguyên liệu thủ công
                            </h4>
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        placeholder="Tìm nguyên liệu trong kho..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                                    value={selectedIngId}
                                    onChange={e => setSelectedIngId(e.target.value)}
                                >
                                    <option value="">-- Chọn nguyên liệu --</option>
                                    {filteredIngredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Số lượng..."
                                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAddManual}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md"
                                    >
                                        THÊM
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách hiện tại */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700">Nguyên liệu đã thiết lập</h4>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-10 text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : recipe.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs italic text-center px-4">Chưa có định mức nào.<br />Hãy thử dùng AI gợi ý hoặc thêm thủ công.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recipe.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-purple-200 transition-colors group">
                                            <div>
                                                <div className="font-bold text-sm text-gray-800">{item.ingredient.name}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                                    Định mức: {item.quantity} {item.ingredient.unit} / món
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.ingredientId)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all shadow-lg"
                    >
                        HOÀN TẤT
                    </button>
                </div>
            </div>
        </div>
    );
}
