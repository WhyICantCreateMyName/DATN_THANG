import React, { useState } from 'react';
import { X, Building2, Phone, MapPin, Plus } from 'lucide-react';
import { ingredientService } from '@/services/ingredient.service';

interface QuickSupplierModalProps {
    onClose: () => void;
    onSuccess: (supplierId: string) => void;
}

export default function QuickSupplierModal({ onClose, onSuccess }: QuickSupplierModalProps) {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return alert('Vui lòng nhập tên nhà cung cấp');
        
        setIsSaving(true);
        try {
            const newSupplier = await ingredientService.createSupplier({ name, contact, address });
            onSuccess(newSupplier.id);
        } catch (error) {
            alert('Lỗi khi thêm nhà cung cấp');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Thêm Nhanh Nhà Cung Cấp</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Tên Nhà Cung Cấp *</label>
                        <input 
                            autoFocus
                            required
                            placeholder="Nhập tên đối tác..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold text-gray-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Liên Hệ</label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                placeholder="SĐT hoặc Email..."
                                value={contact}
                                onChange={e => setContact(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Địa Chỉ</label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                placeholder="Địa chỉ văn phòng..."
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            HỦY BỎ
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                        >
                            {isSaving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
