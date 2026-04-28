'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, XCircle, Check, X, Key } from 'lucide-react';
import { useStaff } from '@/hooks/useStaff';
import { staffService, User } from '@/services/staff.service';
import Pagination from '@/components/ui/Pagination';


interface UserUI extends User {
    isEdit?: boolean;
    isCreate?: boolean;
    tempPassword?: string;
}

export default function StaffModule() {
    const { staffs, meta, page, setPage, mutateStaffs } = useStaff();

    const [localStaffs, setLocalStaffs] = useState<UserUI[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync Staffs
    useEffect(() => {
        if (staffs && !isCreating && !editingId) {
            setLocalStaffs(staffs);
        }
    }, [staffs, isCreating, editingId]);

    const handleAddStaff = () => {
        if (isCreating) return;
        setIsCreating(true);
        const temp: UserUI = {
            id: `temp-${Date.now()}`,
            username: '',
            fullName: '',
            role: 'WAITER',
            isActive: true,
            isCreate: true,
            tempPassword: '',
            createdAt: new Date().toISOString()
        };
        setLocalStaffs([temp, ...localStaffs]);
    };

    const handleEditStaff = (id: string) => {
        setEditingId(id);
        setLocalStaffs(prev => prev.map(s => s.id === id ? { ...s, isEdit: true, tempPassword: '' } : s));
    };

    const handleCancel = (id: string, isCreate?: boolean) => {
        if (isCreate) {
            setIsCreating(false);
            setLocalStaffs(prev => prev.filter(s => s.id !== id));
        } else {
            setEditingId(null);
            const original = staffs?.find(orig => orig.id === id);
            if (original) setLocalStaffs(prev => prev.map(s => s.id === id ? { ...original, isEdit: false } : s));
        }
    };

    const handleSaveStaff = async (staff: UserUI) => {
        if (!staff.username.trim() || !staff.fullName.trim()) return alert('Vui lòng nhập đầy đủ Username và Họ tên');
        if (staff.isCreate && !staff.tempPassword) return alert('Vui lòng nhập mật khẩu cho tài khoản mới');

        setIsSaving(true);
        try {
            const payload: any = {
                username: staff.username,
                fullName: staff.fullName,
                role: staff.role,
                isActive: staff.isActive
            };
            if (staff.tempPassword) payload.password = staff.tempPassword;

            if (staff.isCreate) {
                await staffService.createStaff(payload);
            } else {
                await staffService.updateStaff(staff.id, payload);
            }

            await mutateStaffs();
            setIsCreating(false);
            setEditingId(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi khi lưu thông tin');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xoá nhân viên ${name} khỏi hệ thống?`)) return;
        try {
            await staffService.deleteStaff(id);
            await mutateStaffs();
        } catch (error) {
            alert('Lỗi khi xoá nhân viên');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 font-bold border border-purple-200';
            case 'CASHIER': return 'bg-amber-100 text-amber-700 border border-amber-200';
            case 'KITCHEN': return 'bg-red-100 text-red-700 border border-red-200';
            case 'WAITER': return 'bg-blue-100 text-blue-700 border border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-indigo-500" />
                        Quản lý Nhân Sự & Phân Quyền
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Quản trị danh sách tài khoản, vai trò và trạng thái nhân viên</p>
                </div>
                <button
                    onClick={handleAddStaff}
                    disabled={isCreating}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Nhân Sự
                </button>
            </div>

            <div className="flex-1 overflow-x-auto p-6 bg-white">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Tài khoản</th>
                            <th className="px-6 py-4 font-semibold">Họ và Tên</th>
                            <th className="px-6 py-4 font-semibold">Mật khẩu</th>
                            <th className="px-6 py-4 font-semibold">Vai trò</th>
                            <th className="px-6 py-4 font-semibold">Trạng thái</th>
                            <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {localStaffs.map(staff => (
                            <tr key={staff.id} className={`group transition-colors ${staff.isEdit || staff.isCreate ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                {staff.isEdit || staff.isCreate ? (
                                    <>
                                        <td className="px-6 py-4">
                                            {staff.isCreate ? (
                                                <input
                                                    autoFocus
                                                    placeholder="Username..."
                                                    className="text-gray-800 w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={staff.username}
                                                    onChange={e => setLocalStaffs(prev => prev.map(s => s.id === staff.id ? { ...s, username: e.target.value } : s))}
                                                />
                                            ) : (
                                                <div className="font-bold text-indigo-600">{staff.username}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                placeholder="Họ và tên..."
                                                className="text-gray-800 w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={staff.fullName}
                                                onChange={e => setLocalStaffs(prev => prev.map(s => s.id === staff.id ? { ...s, fullName: e.target.value } : s))}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    placeholder={staff.isCreate ? "Mật khẩu..." : "Đổi mật khẩu..."}
                                                    className="text-gray-800 w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={staff.tempPassword || ''}
                                                    onChange={e => setLocalStaffs(prev => prev.map(s => s.id === staff.id ? { ...s, tempPassword: e.target.value } : s))}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="text-gray-800 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                                value={staff.role}
                                                onChange={e => setLocalStaffs(prev => prev.map(s => s.id === staff.id ? { ...s, role: e.target.value as any } : s))}
                                            >
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="WAITER">WAITER</option>
                                                <option value="KITCHEN">KITCHEN</option>
                                                <option value="CASHIER">CASHIER</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${staff.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                                    {staff.isActive ? 'ACTIVE' : 'LOCKED'}
                                                </span>
                                                <label className="relative inline-flex items-center cursor-pointer scale-90">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={staff.isActive}
                                                        onChange={() => setLocalStaffs(prev => prev.map(s => s.id === staff.id ? { ...s, isActive: !s.isActive } : s))}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                                </label>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleSaveStaff(staff)}
                                                    disabled={isSaving}
                                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(staff.id, staff.isCreate)}
                                                    className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-800">{staff.username}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">ID: {staff.id.split('-')[0]}***</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 font-medium whitespace-nowrap">
                                            {staff.fullName}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs tracking-[0.3em]">
                                            ••••••••
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs tracking-wide ${getRoleBadge(staff.role)}`}>
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {staff.isActive ? (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" /> Hoạt động
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                                                    <XCircle className="w-4 h-4" /> Đã khoá
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">
                                                <button
                                                    onClick={() => handleEditStaff(staff.id)}
                                                    className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {localStaffs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                    Chưa có nhân viên nào trên trang này.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Pagination 
                    page={page} 
                    totalPages={meta?.totalPages || 0} 
                    onPageChange={setPage} 
                    totalItems={meta?.total}
                />
            </div>
        </div>
    );
}
