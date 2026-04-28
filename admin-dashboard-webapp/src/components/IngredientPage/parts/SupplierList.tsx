import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Building2, Phone, MapPin } from 'lucide-react';
import { Supplier, ingredientService } from '@/services/ingredient.service';
import Pagination from '@/components/ui/Pagination';

interface SupplierUI extends Supplier {
    isEdit?: boolean;
    isCreate?: boolean;
}

interface SupplierListProps {
    suppliers: Supplier[];
    mutateSuppliers: () => Promise<any>;
    page: number;
    meta: any;
    onPageChange: (page: number) => void;
}

export default function SupplierList({ suppliers, mutateSuppliers, page, meta, onPageChange }: SupplierListProps) {
    const [localSuppliers, setLocalSuppliers] = useState<SupplierUI[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync with props
    useEffect(() => {
        if (!isCreating && !editingId) {
            setLocalSuppliers(suppliers);
        }
    }, [suppliers, isCreating, editingId]);

    const handleAdd = () => {
        if (isCreating) return;
        setIsCreating(true);
        const temp: SupplierUI = {
            id: `temp-${Date.now()}`,
            name: '',
            contact: '',
            address: '',
            isCreate: true
        };
        setLocalSuppliers([temp, ...localSuppliers]);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setLocalSuppliers(prev => prev.map(s => s.id === id ? { ...s, isEdit: true } : s));
    };

    const handleCancel = (id: string, isCreate?: boolean) => {
        if (isCreate) {
            setIsCreating(false);
            setLocalSuppliers(prev => prev.filter(s => s.id !== id));
        } else {
            setEditingId(null);
            const original = suppliers.find(orig => orig.id === id);
            if (original) setLocalSuppliers(prev => prev.map(s => s.id === id ? { ...original, isEdit: false } : s));
        }
    };

    const handleSave = async (sup: SupplierUI) => {
        if (!sup.name.trim()) return alert('Vui lòng nhập tên nhà cung cấp');
        setIsSaving(true);
        try {
            const payload = {
                name: sup.name,
                contact: sup.contact,
                address: sup.address
            };

            if (sup.isCreate) {
                await ingredientService.createSupplier(payload);
            } else {
                await ingredientService.updateSupplier(sup.id, payload);
            }

            await mutateSuppliers();
            setIsCreating(false);
            setEditingId(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi khi lưu nhà cung cấp');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xoá nhà cung cấp "${name}"?`)) return;
        try {
            await ingredientService.deleteSupplier(id);
            await mutateSuppliers();
        } catch (error) {
            alert('Lỗi khi xoá nhà cung cấp');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Danh sách Nhà Cung Cấp</h3>
                    <p className="text-xs text-gray-500">Quản lý thông tin đối tác cung ứng</p>
                </div>
                <button 
                    onClick={handleAdd}
                    disabled={isCreating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Nhà Cung Cấp
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-6 py-4 font-semibold">Thông tin Đối tác</th>
                                <th className="px-6 py-4 font-semibold">Liên hệ</th>
                                <th className="px-6 py-4 font-semibold">Địa chỉ</th>
                                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {localSuppliers.map((sup) => {
                                const isEditing = sup.isEdit || sup.isCreate;

                                return (
                                    <tr key={sup.id} className={`group transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                        {isEditing ? (
                                            <>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        autoFocus
                                                        placeholder="Tên nhà cung cấp..."
                                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        value={sup.name}
                                                        onChange={e => setLocalSuppliers(prev => prev.map(s => s.id === sup.id ? { ...s, name: e.target.value } : s))}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        placeholder="Số điện thoại / Email..."
                                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        value={sup.contact || ''}
                                                        onChange={e => setLocalSuppliers(prev => prev.map(s => s.id === sup.id ? { ...s, contact: e.target.value } : s))}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        placeholder="Địa chỉ văn phòng..."
                                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        value={sup.address || ''}
                                                        onChange={e => setLocalSuppliers(prev => prev.map(s => s.id === sup.id ? { ...s, address: e.target.value } : s))}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSave(sup)}
                                                            disabled={isSaving}
                                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(sup.id, sup.isCreate)}
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
                                                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                                            <Building2 className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-semibold text-gray-800">{sup.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                        {sup.contact || '---'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate max-w-[250px]">{sup.address || '---'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <button
                                                            onClick={() => handleEdit(sup.id)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sup.id, sup.name)}
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
        </div>
    );
}
