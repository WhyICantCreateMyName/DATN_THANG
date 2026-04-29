'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import constants from '../../constants';
import { useAuthContext } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    LibrarySquare,
    LayoutPanelTop,
    ChefHat,
    MessageCircle,
    Package,
    Ticket
} from 'lucide-react';

const SIDEBAR_TABS = [
    { name: 'Tổng quan', link: constants.ROUTES.DASHBOARD, icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Bán hàng (POS)', link: constants.ROUTES.POS, icon: LayoutPanelTop, roles: ['ADMIN', 'CASHIER', 'WAITER'] },
    { name: 'Nhà bếp', link: constants.ROUTES.KITCHEN, icon: ChefHat, roles: ['ADMIN', 'KITCHEN'] },
    { name: 'Sơ đồ Bàn', link: constants.ROUTES.TABLES, icon: LibrarySquare, roles: ['ADMIN', 'CASHIER', 'WAITER'] },
    { name: 'Thực đơn', link: constants.ROUTES.MENU, icon: UtensilsCrossed, roles: ['ADMIN', 'CASHIER', 'KITCHEN'] },
    { name: 'Nguyên liệu', link: constants.ROUTES.INGREDIENTS, icon: Package, roles: ['ADMIN', 'KITCHEN'] },
    { name: 'Khuyến mãi', link: constants.ROUTES.VOUCHERS, icon: Ticket, roles: ['ADMIN'] },
    { name: 'Nhân sự', link: constants.ROUTES.STAFF, icon: Users, roles: ['ADMIN'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthContext();

    // Lọc tabs dựa trên role
    const filteredTabs = SIDEBAR_TABS.filter(tab => !tab.roles || tab.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed top-0 left-0 border-r border-gray-800 shadow-xl overflow-y-auto">
            {/* Logo Section */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-800 mb-6">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        RESTAURANT
                    </h1>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                        Admin Portal
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 px-4 space-y-2">
                {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.link || (tab.link !== constants.ROUTES.DASHBOARD && pathname.startsWith(tab.link));

                    return (
                        <Link
                            key={tab.name}
                            href={tab.link}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium group ${isActive
                                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-inner'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-sm">{tab.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / Info */}
            <div className="p-6 border-t border-gray-800 mt-auto">
                <p className="text-xs text-gray-500 text-center">
                    &copy; 2026 Quản lý nhà hàng
                </p>
            </div>
        </aside>
    );
}
