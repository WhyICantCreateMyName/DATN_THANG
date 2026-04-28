'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UtensilsCrossed, Check, X, Image as ImageIcon } from 'lucide-react';
import { menuService, Category, MenuItem } from '@/services/menu.service';

interface MenuItemUI extends MenuItem {
    isEdit?: boolean;
    isCreate?: boolean;
}

interface MenuItemListProps {
    menuItems: (MenuItem & { category: Category })[] | undefined;
    categories: Category[] | undefined;
    selectedCategoryId: string | null;
    mutateItems: () => Promise<any>;
    itemPage: number;
    setItemPage: React.Dispatch<React.SetStateAction<number>>;
    metaItems: any;
}

export default function MenuItemList({
    menuItems,
    categories,
    selectedCategoryId,
    mutateItems,
    itemPage,
    setItemPage,
    metaItems
}: MenuItemListProps) {
    const [localItems, setLocalItems] = useState<MenuItemUI[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingItem, setIsCreatingItem] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Image selection state
    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});
    const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
    const fileInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Sync Items
    useEffect(() => {
        if (menuItems && !isCreatingItem && !editingItemId) {
            setLocalItems(menuItems);
        }
    }, [menuItems, isCreatingItem, editingItemId]);

    const handleAddItem = () => {
        if (isCreatingItem) return;
        setIsCreatingItem(true);
        const temp: MenuItemUI = {
            id: `temp-item-${Date.now()}`,
            name: '',
            description: '',
            price: 0,
            imageUrl: '',
            isAvailable: true,
            categoryId: selectedCategoryId || (categories && categories.length > 0 ? categories[0].id : ''),
            isCreate: true
        };
        setLocalItems([temp, ...localItems]);
    };

    const handleEditItem = (id: string) => {
        setEditingItemId(id);
        setLocalItems(prev => prev.map(i => i.id === id ? { ...i, isEdit: true } : i));
    };

    const handleCancelItem = (id: string, isCreate?: boolean) => {
        if (isCreate) {
            setIsCreatingItem(false);
            setLocalItems(prev => prev.filter(i => i.id !== id));
        } else {
            setEditingItemId(null);
            const original = menuItems?.find(orig => orig.id === id);
            if (original) setLocalItems(prev => prev.map(i => i.id === id ? { ...original, isEdit: false } : i));
        }
    };

    const handleSaveItem = async (item: MenuItemUI) => {
        if (!item.name.trim()) return alert('Vui lòng nhập tên món');
        setIsSaving(true);
        try {
            let finalImageUrl = item.imageUrl;

            // 1. Upload new image if selected
            const file = selectedFiles[item.id];
            if (file) {
                try {
                    finalImageUrl = await menuService.uploadImage(file);
                } catch (err) {
                    alert('Lỗi khi tải ảnh lên server');
                    throw err;
                }
            }

            const { isCreate, isEdit, ...data } = item;
            const payload = { ...data, imageUrl: finalImageUrl };

            if (isCreate) await menuService.createMenuItem(payload);
            else await menuService.updateMenuItem(item.id, payload);

            await mutateItems();
            setIsCreatingItem(false);
            setEditingItemId(null);

            // Clean up temporary states
            const newFiles = { ...selectedFiles };
            delete newFiles[item.id];
            setSelectedFiles(newFiles);

            const newPreviews = { ...previewUrls };
            delete newPreviews[item.id];
            setPreviewUrls(newPreviews);

        } catch (error) {
            console.error('Save Error:', error);
            alert('Lỗi lưu món ăn');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFiles(prev => ({ ...prev, [itemId]: file }));
            const url = URL.createObjectURL(file);
            setPreviewUrls(prev => ({ ...prev, [itemId]: url }));
        }
    };

    const handleDeleteItem = async (id: string, name: string) => {
        if (!confirm(`Xoá món "${name}"?`)) return;
        try {
            await menuService.deleteMenuItem(id);
            await mutateItems();
        } catch (error) {
            alert('Lỗi xoá món ăn');
        }
    };

    const handleToggleAvailable = async (item: MenuItem) => {
        try {
            await menuService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
            await mutateItems();
        } catch (error) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    return (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-purple-500" />
                    Danh sách món ăn
                </h2>
                <button
                    onClick={handleAddItem}
                    disabled={isCreatingItem}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Món Mới
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {localItems.map(item => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
                            {item.isEdit || item.isCreate ? (
                                <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(item); }} className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={el => { fileInputRefs.current[item.id] = el; }}
                                            onChange={(e) => handleFileChange(item.id, e)}
                                        />
                                        <div
                                            onClick={() => fileInputRefs.current[item.id]?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50', 'border-blue-300'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300'); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                                const droppedFile = e.dataTransfer.files?.[0];
                                                if (droppedFile && droppedFile.type.startsWith('image/')) {
                                                    const dummyEvent = { target: { files: [droppedFile] } } as any;
                                                    handleFileChange(item.id, dummyEvent);
                                                }
                                            }}
                                            className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 overflow-hidden relative group/upload transition-all"
                                        >
                                            {(previewUrls[item.id] || item.imageUrl) ? (
                                                <img
                                                    src={previewUrls[item.id] || (item.imageUrl?.startsWith('http') ? item.imageUrl : '/' + item.imageUrl) || ''}
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="w-6 h-6" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity">
                                                <Plus className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                autoFocus
                                                placeholder="Tên món..."
                                                className="w-full text-sm font-bold border-b border-blue-200 outline-none focus:border-blue-500 pb-1 text-gray-500"
                                                value={item.name}
                                                onChange={e => setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Giá tiền..."
                                                className="w-full text-xs font-bold text-blue-600 border-b border-blue-100 outline-none pb-1"
                                                value={item.price}
                                                onChange={e => setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, price: parseInt(e.target.value) || 0 } : i))}
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        placeholder="Mô tả món ăn..."
                                        className="w-full text-xs text-gray-500 border border-gray-100 rounded-lg p-2 outline-none focus:border-blue-300 resize-none h-16"
                                        value={item.description || ''}
                                        onChange={e => setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                                    />
                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                                        <select
                                            className="text-xs bg-transparent outline-none font-medium text-gray-600"
                                            value={item.categoryId}
                                            onChange={e => setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, categoryId: e.target.value } : i))}
                                        >
                                            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div className="flex gap-2">
                                            <button type="submit" disabled={isSaving} className="p-2 bg-green-500 text-white rounded-lg"><Check className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleCancelItem(item.id, item.isCreate)} className="p-2 bg-gray-200 text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl.startsWith('http') ? item.imageUrl : '/' + item.imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditItem(item.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDeleteItem(item.id, item.name)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">{item.description || 'Chưa có mô tả...'}</p>
                                            <div className="mt-2 text-blue-600 font-bold">{item.price.toLocaleString('vi-VN')} ₫</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className={`text-xs font-semibold ${item.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.isAvailable ? 'Sẵn sàng' : 'Hết món'}
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={item.isAvailable}
                                                onChange={() => handleToggleAvailable(item)}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {localItems.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
                            <UtensilsCrossed className="w-12 h-12 mb-3 text-gray-300" />
                            <p>Chưa có món ăn nào trong mục này.</p>
                        </div>
                    )}
                </div>
            </div>
            {metaItems && metaItems.totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-white">
                    <button onClick={() => setItemPage(p => Math.max(1, p - 1))} disabled={itemPage === 1} className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">Trang trước</button>
                    <span className="text-sm font-medium text-gray-500">Trang {itemPage} / {metaItems.totalPages}</span>
                    <button onClick={() => setItemPage(p => Math.min(metaItems.totalPages, p + 1))} disabled={itemPage === metaItems.totalPages} className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">Trang sau</button>
                </div>
            )}
        </div>
    );
}
