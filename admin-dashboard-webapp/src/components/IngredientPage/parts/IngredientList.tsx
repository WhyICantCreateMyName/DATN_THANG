import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowUpRight, AlertTriangle, Package, Check, X, Search } from 'lucide-react';
import { Ingredient, ingredientService, Supplier } from '@/services/ingredient.service';
import QuickSupplierModal from './QuickSupplierModal';
import Pagination from '@/components/ui/Pagination';


interface IngredientUI extends Ingredient {
    isEdit?: boolean;
    isCreate?: boolean;
}

interface IngredientListProps {
    ingredients: Ingredient[];
    suppliers: Supplier[];
    mutateIngredients: () => Promise<any>;
    mutateSuppliers: () => Promise<any>;
    onUpdateStock: (ing: Ingredient) => void;
    page: number;
    meta: any;
    onPageChange: (page: number) => void;
    keyword: string;
    setKeyword: (val: string) => void;
}

export default function IngredientList({ ingredients, suppliers, mutateIngredients, mutateSuppliers, onUpdateStock, page, meta, onPageChange, keyword, setKeyword }: IngredientListProps) {
    const [localIngredients, setLocalIngredients] = useState<IngredientUI[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false);
    const [pendingIngId, setPendingIngId] = useState<string | null>(null);

    // Sync with props
    useEffect(() => {
        if (!isCreating && !editingId) {
            setLocalIngredients(ingredients);
        }
    }, [ingredients, isCreating, editingId]);

    const handleAdd = () => {
        if (isCreating) return;
        setIsCreating(true);
        const temp: IngredientUI = {
            id: `temp-${Date.now()}`,
            name: '',
            unit: '',
            minStock: 0,
            currentStock: 0,
            isCreate: true
        };
        setLocalIngredients([temp, ...localIngredients]);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setLocalIngredients(prev => prev.map(i => i.id === id ? { ...i, isEdit: true } : i));
    };

    const handleCancel = (id: string, isCreate?: boolean) => {
        if (isCreate) {
            setIsCreating(false);
            setLocalIngredients(prev => prev.filter(i => i.id !== id));
        } else {
            setEditingId(null);
            const original = ingredients.find(orig => orig.id === id);
            if (original) setLocalIngredients(prev => prev.map(i => i.id === id ? { ...original, isEdit: false } : i));
        }
    };

    const handleSave = async (ing: IngredientUI) => {
        if (!ing.name.trim() || !ing.unit.trim()) return alert('Vui lòng nhập đầy đủ thông tin');
        setIsSaving(true);
        try {
            const payload = {
                name: ing.name,
                unit: ing.unit,
                minStock: ing.minStock
            };

            if (ing.isCreate) {
                await ingredientService.createIngredient(payload);
            } else {
                await ingredientService.updateIngredient(ing.id, payload);
            }

            await mutateIngredients();
            setIsCreating(false);
            setEditingId(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi khi lưu nguyên liệu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xoá nguyên liệu "${name}"?`)) return;
        try {
            await ingredientService.deleteIngredient(id);
            await mutateIngredients();
        } catch (error) {
            alert('Lỗi khi xoá nguyên liệu');
        }
    };

    const handleQuickSupplierSuccess = async (supplierId: string) => {
        await mutateSuppliers();
        if (pendingIngId) {
            setLocalIngredients(prev => prev.map(i => i.id === pendingIngId ? { ...i, supplierId } : i));
        }
        setIsQuickSupplierModalOpen(false);
        setPendingIngId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center px-2 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Danh sách Nguyên liệu</h3>
                    <p className="text-xs text-gray-500">Quản lý kho và định mức</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên nguyên liệu..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Nguyên Liệu
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-6 py-4 font-semibold">Nguyên liệu & Nhà cung cấp</th>
                                <th className="px-6 py-4 font-semibold">Định mức & Đơn vị</th>
                                <th className="px-6 py-4 font-semibold">Tồn kho hiện tại</th>
                                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {localIngredients.map((ing) => {
                                const isLowStock = ing.currentStock <= ing.minStock;
                                const isEditing = ing.isEdit || ing.isCreate;

                                return (
                                    <tr key={ing.id} className={`group transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                        {isEditing ? (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            autoFocus
                                                            placeholder="Tên nguyên liệu..."
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                            value={ing.name}
                                                            onChange={e => setLocalIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, name: e.target.value } : i))}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Mức min"
                                                            className="w-20 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            value={ing.minStock}
                                                            onChange={e => setLocalIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, minStock: parseFloat(e.target.value) || 0 } : i))}
                                                        />
                                                        <select
                                                            className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            value={ing.unit}
                                                            onChange={e => setLocalIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, unit: e.target.value } : i))}
                                                        >
                                                            <option value="">Đvị</option>
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
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-base font-bold text-gray-400 italic">---</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSave(ing)}
                                                            disabled={isSaving}
                                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(ing.id, ing.isCreate)}
                                                            className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl flex-shrink-0 ${isLowStock ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                            <Package className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{ing.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mức tối thiểu</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-700">{ing.minStock}</span>
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                                                {ing.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-base font-bold ${isLowStock ? 'text-red-500' : 'text-gray-700'}`}>
                                                            {ing.currentStock}
                                                        </span>
                                                        {isLowStock && (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-tight animate-pulse">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Sắp hết
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <button
                                                            onClick={() => onUpdateStock(ing)}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
                                                            title="Cập nhật kho"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(ing.id)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(ing.id, ing.name)}
                                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                                            title="Xoá"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    totalPages={meta?.totalPages || 0}
                    onPageChange={onPageChange}
                    totalItems={meta?.total}
                />
            </div>

            {isQuickSupplierModalOpen && (
                <QuickSupplierModal
                    onClose={() => setIsQuickSupplierModalOpen(false)}
                    onSuccess={handleQuickSupplierSuccess}
                />
            )}
        </div>
    );
}
