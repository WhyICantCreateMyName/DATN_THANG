'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Info } from 'lucide-react';
import { voucherService, Voucher } from '@/services/voucher.service';

interface VoucherFormModalProps {
    voucher: Voucher | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function VoucherFormModal({ voucher, onClose, onSuccess }: VoucherFormModalProps) {
    const [formData, setFormData] = useState<Partial<Voucher>>({
        code: '',
        description: '',
        discountType: 'FIXED',
        discountValue: 0,
        maxDiscount: 0,
        minOrderValue: 0,
        usageLimit: 0,
        isActive: true,
        startDate: '',
        endDate: '',
        conditions: []
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (voucher) {
            setFormData({
                ...voucher,
                startDate: voucher.startDate ? new Date(voucher.startDate).toISOString().slice(0, 16) : '',
                endDate: voucher.endDate ? new Date(voucher.endDate).toISOString().slice(0, 16) : '',
            });
        }
    }, [voucher]);

    const handleAddCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...(prev.conditions || []), { type: 'NEW_USER', value: 0 }]
        }));
    };

    const handleRemoveCondition = (index: number) => {
        setFormData(prev => ({
            ...prev,
            conditions: (prev.conditions || []).filter((_, i) => i !== index)
        }));
    };

    const handleConditionChange = (index: number, field: string, value: any) => {
        const newConds = [...(formData.conditions || [])];
        newConds[index] = { ...newConds[index], [field]: value };
        setFormData(prev => ({ ...prev, conditions: newConds }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (voucher) {
                await voucherService.updateVoucher(voucher.id, formData);
            } else {
                await voucherService.createVoucher(formData);
            }
            onSuccess();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Lỗi khi lưu voucher');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                            <Save className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{voucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Thiết lập chương trình khuyến mãi và điều kiện áp dụng</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Mã Voucher</label>
                            <input 
                                required
                                placeholder="VD: CHAOHE2024"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-800 placeholder:font-normal uppercase"
                                value={formData.code || ''}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                disabled={!!voucher}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Loại giảm giá</label>
                            <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.discountType}
                                onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                            >
                                <option value="FIXED">Số tiền cố định (đ)</option>
                                <option value="PERCENTAGE">Phần trăm (%)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Giá trị giảm</label>
                            <input 
                                type="number"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.discountValue}
                                onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">
                                {formData.discountType === 'FIXED' ? 'Đơn tối thiểu' : 'Giảm tối đa'}
                            </label>
                            <input 
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.discountType === 'FIXED' ? (formData.minOrderValue || 0) : (formData.maxDiscount || 0)}
                                onChange={e => setFormData({ 
                                    ...formData, 
                                    [formData.discountType === 'FIXED' ? 'minOrderValue' : 'maxDiscount']: parseFloat(e.target.value) || 0
                                })}
                            />
                        </div>
                    </div>

                    {/* Usage & Time */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Giới hạn sử dụng (Tổng)</label>
                            <input 
                                type="number"
                                placeholder="Để trống nếu không giới hạn"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:font-normal"
                                value={formData.usageLimit || ''}
                                onChange={e => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Giới hạn dùng (Mỗi khách)</label>
                            <input 
                                type="number"
                                placeholder="VD: 1 (Lần)"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:font-normal"
                                value={formData.maxUsagePerCustomer || ''}
                                onChange={e => setFormData({ ...formData, maxUsagePerCustomer: e.target.value ? parseInt(e.target.value) : 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Giá trị đơn tối thiểu (đ)</label>
                            <input 
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.minOrderValue}
                                onChange={e => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Trạng thái</label>
                            <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.isActive ? 'true' : 'false'}
                                onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                            >
                                <option value="true">Đang hoạt động</option>
                                <option value="false">Tạm ngưng</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Ngày bắt đầu</label>
                            <input 
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Ngày kết thúc</label>
                            <input 
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                value={formData.endDate || ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Conditions Area */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-indigo-500" />
                                <label className="text-sm font-bold text-gray-800">Điều kiện kích hoạt Voucher</label>
                            </div>
                            <button 
                                type="button"
                                onClick={handleAddCondition}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Thêm điều kiện
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.conditions?.map((cond, index) => (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-left-2 duration-300">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <select 
                                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500"
                                            value={cond.type}
                                            onChange={e => handleConditionChange(index, 'type', e.target.value)}
                                        >
                                            <option value="NEW_USER">Khách hàng mới (Lần đầu)</option>
                                            <option value="MIN_ORDERS">Số đơn hoàn thành tối thiểu</option>
                                        </select>
                                        {cond.type === 'MIN_ORDERS' && (
                                            <input 
                                                type="number"
                                                placeholder="Số đơn..."
                                                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500"
                                                value={cond.value}
                                                onChange={e => handleConditionChange(index, 'value', parseInt(e.target.value))}
                                            />
                                        )}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveCondition(index)}
                                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!formData.conditions || formData.conditions.length === 0) && (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <div className="inline-flex p-3 bg-gray-50 rounded-full text-gray-300 mb-2">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium italic">Chưa có điều kiện tùy biến. Voucher sẽ áp dụng cho tất cả khách hàng.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Mô tả chương trình</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-gray-800 resize-none"
                            placeholder="VD: Giảm 20% cho khách hàng mới trong tháng 5..."
                            rows={3}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? 'ĐANG LƯU...' : (
                            <>
                                <Save className="w-4 h-4" />
                                {voucher ? 'Cập nhật Voucher' : 'Kích hoạt Voucher'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
