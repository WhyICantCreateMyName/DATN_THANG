import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { Ingredient, Supplier } from '@/services/ingredient.service';

interface IngredientFormModalProps {
    ingredient?: Ingredient | null;
    suppliers: Supplier[];
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function IngredientFormModal({ ingredient, suppliers, onClose, onSubmit }: IngredientFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        minStock: 5,
        supplierId: ''
    });

    useEffect(() => {
        if (ingredient) {
            setFormData({
                name: ingredient.name,
                unit: ingredient.unit,
                minStock: ingredient.minStock,
                supplierId: ingredient.supplierId || ''
            });
        }
    }, [ingredient]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {ingredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Thông tin cơ bản</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Tên nguyên liệu</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="VD: Thịt bò, Hành lá, Muối..."
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-gray-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Đơn vị tính</label>
                            <select 
                                required
                                value={formData.unit}
                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-gray-800"
                            >
                                <option value="">Chọn đơn vị...</option>
                                <optgroup label="Khối lượng">
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                </optgroup>
                                <optgroup label="Thể tích">
                                    <option value="l">lít</option>
                                    <option value="ml">ml</option>
                                </optgroup>
                                <optgroup label="Số lượng/Khác">
                                    <option value="cái">cái</option>
                                    <option value="quả">quả</option>
                                    <option value="con">con</option>
                                    <option value="bó">bó</option>
                                    <option value="hộp">hộp</option>
                                    <option value="lọ">lọ</option>
                                    <option value="bịch">bịch</option>
                                    <option value="thùng">thùng</option>
                                    <option value="gói">gói</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Tồn kho tối thiểu</label>
                            <input 
                                type="number" 
                                required
                                value={formData.minStock}
                                onChange={(e) => setFormData({...formData, minStock: parseFloat(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-gray-800"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Nhà cung cấp</label>
                            <select 
                                value={formData.supplierId}
                                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-gray-800"
                            >
                                <option value="">Chọn nhà cung cấp...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                    >
                        <Save className="w-4 h-4" />
                        {ingredient ? 'Lưu thay đổi' : 'Tạo nguyên liệu'}
                    </button>
                </form>
            </div>
        </div>
    );
}
