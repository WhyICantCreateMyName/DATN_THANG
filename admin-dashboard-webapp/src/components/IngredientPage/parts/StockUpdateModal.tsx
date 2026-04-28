import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, ClipboardList } from 'lucide-react';
import { Ingredient, ingredientService } from '@/services/ingredient.service';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSuppliers } from '@/hooks/useSuppliers';

interface StockUpdateModalProps {
    ingredient: Ingredient;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockUpdateModal({ ingredient, onClose, onSuccess }: StockUpdateModalProps) {
    const { user } = useAuthContext();
    const { suppliers } = useSuppliers(); // Lấy danh sách NCC

    const [type, setType] = useState('IMPORT');
    const [quantity, setQuantity] = useState(0);
    const [note, setNote] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) return alert('Vui lòng nhập số lượng hợp lệ');
        if (!user?.id) return alert('Lỗi xác thực người dùng');

        setIsSaving(true);
        try {
            await ingredientService.recordTransaction({
                ingredientId: ingredient.id,
                type,
                quantity,
                note,
                userId: user.id,
                supplierId: (type === 'IMPORT' && supplierId) ? supplierId : undefined
            });
            onSuccess();
        } catch (error) {
            alert('Lỗi khi cập nhật kho');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Cập nhật kho</h3>
                        <p className="text-sm text-gray-500 mt-1">{ingredient.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Loại giao dịch */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'IMPORT', label: 'NHẬP', icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                            { id: 'EXPORT', label: 'XUẤT', icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                            { id: 'AUDIT_START', label: 'KIỂM', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setType(t.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1
                                    ${type === t.id ? `${t.bg} ${t.border} ${t.color} scale-[1.05]` : 'border-gray-50 text-gray-400 bg-white hover:border-gray-100'}
                                `}
                            >
                                <t.icon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Nhà cung cấp (Chỉ hiện khi NHẬP) */}
                    {type === 'IMPORT' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Nhà cung cấp</label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm text-gray-800"
                            >
                                <option value="">-- Chọn nhà cung cấp --</option>
                                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Số lượng */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Số lượng ({ingredient.unit})</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            value={quantity || ''}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-lg text-gray-800"
                        />
                    </div>

                    {/* Ghi chú */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Ghi chú / Lý do</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="VD: Nhập thêm từ NCC, Hao hụt cuối ca..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm text-gray-800 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSaving ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN CẬP NHẬT'}
                    </button>
                </form>
            </div>
        </div>
    );
}
