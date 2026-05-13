'use client';

import { Search, Bell, ChevronDown, UserCircle, LogOut, LayoutGrid, Clock } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useOrderContext } from '@/contexts/OrderContext';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
    const { user, logout } = useAuthContext();
    const { waitingOrders } = useOrderContext();
    const [isOpen, setIsOpen] = useState(false);

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

                {/* Order Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`relative p-2.5 transition-all rounded-2xl flex items-center gap-2 ${waitingOrders.length > 0
                                ? 'bg-red-50 text-red-600 ring-2 ring-red-100 animate-pulse'
                                : 'text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100'
                            }`}
                    >
                        <Bell className={`w-5 h-5 ${waitingOrders.length > 0 ? 'fill-current' : ''}`} />
                        {waitingOrders.length > 0 && (
                            <div className="flex flex-col items-start leading-none pr-1">
                                <span className="text-[10px] font-black uppercase tracking-tighter">Cần duyệt</span>
                                <span className="text-sm font-black">{waitingOrders.length}</span>
                            </div>
                        )}
                    </button>

                    {/* Dropdown danh sách đơn hàng chờ */}
                    {isOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-tight">Đơn hàng chờ duyệt</h3>
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full">{waitingOrders.length} ĐƠN</span>
                            </div>

                            <div className="max-h-[320px] overflow-y-auto">
                                {waitingOrders.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <Bell className="w-6 h-6 opacity-20" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Tất cả đã xử lý xong</p>
                                    </div>
                                ) : (
                                    waitingOrders.map((order) => (
                                        <div key={order.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black text-sm">
                                                    {order.table?.name?.match(/\d+/)?.[0] || 'A'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">Bàn {order.table?.name || '...'}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 0} món</p>
                                                </div>
                                            </div>
                                            <Link
                                                href="/pos"
                                                onClick={() => setIsOpen(false)}
                                                className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:gap-2 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                Đến ngay <ChevronDown className="w-3 h-3 -rotate-90" />
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>

                            {waitingOrders.length > 0 && (
                                <Link
                                    href="/pos"
                                    onClick={() => setIsOpen(false)}
                                    className="block p-3 text-center bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 transition-all border-t border-gray-100"
                                >
                                    Xem toàn bộ trong POS
                                </Link>
                            )}
                        </div>
                    )}
                </div>

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

                    {/* Dropdown Menu */}
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
