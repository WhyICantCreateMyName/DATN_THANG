'use client';

import React from 'react';
import { Search, Bell, ChevronDown, UserCircle, LogOut } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Header() {
    const { user, logout } = useAuthContext();

    return (
        <header className="h-20 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-8 ml-64 sticky top-0 z-40 transition-all">
            
            {/* Left: Global Searchbar */}
            <div className="flex-1 flex max-w-xl">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bàn, đơn hàng, mặt hàng thức ăn nhanh..."
                        className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-2xl text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-gray-700"
                    />
                </div>
            </div>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center gap-6">
                
                {/* Notification Bell */}
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="w-px h-8 bg-gray-200"></div>

                {/* User Profile Panel */}
                <div className="relative group cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 shadow-sm">
                            <span className="font-bold">{user?.fullName?.charAt(0) || 'A'}</span>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Người Dùng'}</p>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">
                                {user?.role === 'ADMIN' ? 'Quản Trị Viên' : user?.role || 'Staff'}
                            </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>

                    {/* Dropdown Menu (Hiển thị khi hover) */}
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                        <div className="py-2">
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                                <UserCircle className="w-4 h-4" />
                                Hồ sơ cá nhân
                            </button>
                            <div className="my-1 border-t border-gray-100"></div>
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}
