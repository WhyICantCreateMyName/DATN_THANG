'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Check, X } from 'lucide-react';
import { menuService, Category } from '@/services/menu.service';

interface CategoryUI extends Category {
    isEdit?: boolean;
    isCreate?: boolean;
}

interface CategorySidebarProps {
    categories: Category[] | undefined;
    selectedCategoryId: string | null;
    setSelectedCategoryId: (id: string | null) => void;
    mutateCats: () => Promise<any>;
    catPage: number;
    setCatPage: React.Dispatch<React.SetStateAction<number>>;
    metaCats: any;
}

export default function CategorySidebar({
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    mutateCats,
    catPage,
    setCatPage,
    metaCats
}: CategorySidebarProps) {
    const [localCats, setLocalCats] = useState<CategoryUI[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingCat, setIsCreatingCat] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);

    // Sync Categories
    useEffect(() => {
        if (categories && !isCreatingCat && !editingCatId) {
            setLocalCats(categories);
        }
    }, [categories, isCreatingCat, editingCatId]);

    const handleAddCat = () => {
        if (isCreatingCat) return;
        setIsCreatingCat(true);
        const temp: CategoryUI = { id: `temp-cat-${Date.now()}`, name: '', isCreate: true };
        setLocalCats([temp, ...localCats]);
    };

    const handleEditCat = (id: string) => {
        setEditingCatId(id);
        setLocalCats(prev => prev.map(c => c.id === id ? { ...c, isEdit: true } : c));
    };

    const handleCancelCat = (id: string, isCreate?: boolean) => {
        if (isCreate) {
            setIsCreatingCat(false);
            setLocalCats(prev => prev.filter(c => c.id !== id));
        } else {
            setEditingCatId(null);
            setLocalCats(prev => prev.map(c => c.id === id ? { ...categories?.find(orig => orig.id === id)!, isEdit: false } : c));
        }
    };

    const handleSaveCat = async (cat: CategoryUI) => {
        if (!cat.name.trim()) return;
        setIsSaving(true);
        try {
            if (cat.isCreate) await menuService.createCategory(cat.name);
            else await menuService.updateCategory(cat.id, cat.name);
            await mutateCats();
            setIsCreatingCat(false);
            setEditingCatId(null);
        } catch (error) {
            alert('Lỗi lưu danh mục');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCat = async (id: string, name: string) => {
        if (!confirm(`Xoá danh mục "${name}"?`)) return;
        try {
            await menuService.deleteCategory(id);
            if (selectedCategoryId === id) setSelectedCategoryId(null);
            await mutateCats();
        } catch (error) {
            alert('Lỗi xoá danh mục');
        }
    };

    return (
        <div className="md:w-1/4 lg:w-1/5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-500" />
                    Danh mục
                </h2>
                <button
                    onClick={handleAddCat}
                    disabled={isSaving || isCreatingCat}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium ${selectedCategoryId === null
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Tất cả món ăn
                </button>
                {localCats.map((cat) => (
                    <div key={cat.id} className={`group relative flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium cursor-pointer ${selectedCategoryId === cat.id && !cat.isEdit
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => !cat.isEdit && !cat.isCreate && setSelectedCategoryId(cat.id)}>

                        {cat.isEdit || cat.isCreate ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveCat(cat); }} className="flex-1 flex gap-1 items-center">
                                <input
                                    autoFocus
                                    className="flex-1 bg-white border border-blue-200 rounded px-2 py-0.5 text-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
                                    value={cat.name}
                                    onChange={(e) => setLocalCats(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))}
                                />
                                <button type="submit" className="text-green-500 hover:text-green-600"><Check className="w-4 h-4" /></button>
                                <button type="button" onClick={() => handleCancelCat(cat.id, cat.isCreate)} className="text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </form>
                        ) : (
                            <>
                                <span className="flex-1">{cat.name}</span>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleEditCat(cat.id); }} className="p-1 hover:bg-white/20 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id, cat.name); }} className="p-1 hover:bg-white/20 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            {metaCats && metaCats.totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                    <button onClick={() => setCatPage(p => Math.max(1, p - 1))} disabled={catPage === 1} className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-50">Trước</button>
                    <span className="text-xs text-gray-400 font-medium">{catPage} / {metaCats.totalPages}</span>
                    <button onClick={() => setCatPage(p => Math.min(metaCats.totalPages, p + 1))} disabled={catPage === metaCats.totalPages} className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-50">Sau</button>
                </div>
            )}
        </div>
    );
}
