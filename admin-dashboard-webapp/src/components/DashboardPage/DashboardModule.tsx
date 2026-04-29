'use client';

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, CalendarCheck, Percent, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

const dummyRevenueData = [
    { name: 'T2', amount: 4500000 },
    { name: 'T3', amount: 5200000 },
    { name: 'T4', amount: 4800000 },
    { name: 'T5', amount: 6100000 },
    { name: 'T6', amount: 8900000 },
    { name: 'T7', amount: 12500000 },
    { name: 'CN', amount: 14200000 },
];

const dummyPopularItems = [
    { name: 'Beefsteak', orders: 145 },
    { name: 'Mì Ý Hải Sản', orders: 112 },
    { name: 'Trà đào', orders: 204 },
    { name: 'Cơm chiên', orders: 89 },
];

export default function DashboardModule() {
    const {
        todayRevenue,
        last7DaysRevenue,
        popularItems,
        stockAlerts,
        stats,
        isLoading
    } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[calc(100vh-120px)]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                            Tổng quan Hệ Thống & Hiệu suất
                        </h2>
                        <p className="text-sm text-gray-500 font-medium italic">Chào mừng trở lại! Dưới đây là hiệu suất kinh doanh hôm nay.</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4" />
                        Hôm nay: {new Date().toLocaleDateString('vi-VN')}
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-8 bg-white flex-1 overflow-y-auto">
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { title: 'Doanh thu hôm nay', value: `${todayRevenue.toLocaleString()} ₫`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { title: 'Lấp đầy bàn', value: `${stats.fillRate}%`, sub: `${stats.occupiedTables}/${stats.totalTables} bàn đang dùng`, icon: Percent, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { title: 'Đơn hàng mới', value: stats.totalOrdersToday.toString(), icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { title: 'Nhân sự trực', value: stats.totalStaffs.toString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-4 group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${card.bg}`}>
                                <card.icon className={`w-7 h-7 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{card.title}</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">{card.value}</h3>
                                {card.sub && <p className="text-[10px] text-gray-500 mt-1 font-bold italic">{card.sub}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto min-h-[450px]">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Biến động Doanh thu</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Thống kê 7 ngày gần nhất</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Đơn vị: VNĐ</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last7DaysRevenue}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }} tickFormatter={(value) => `${value >= 1000000 ? (value / 1000000).toFixed(1) + 'tr' : value.toLocaleString()}`} />
                                    <RechartsTooltip
                                        formatter={(value: any) => [`${Number(value).toLocaleString()} ₫`, 'Doanh thu']}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Popular Items */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Món bán chạy</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mb-8">Top 5 món yêu thích</p>
                        </div>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={popularItems} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 800 }} width={80} />
                                    <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
                                    <Bar dataKey="orders" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Stock Alerts Widget */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Cảnh báo nhập hàng</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Nguyên vật liệu sắp hết (Tồn kho ≤ Tối thiểu)</p>
                        </div>
                        <button className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors uppercase tracking-widest">Xem toàn bộ kho</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        {stockAlerts.length > 0 ? stockAlerts.map((item: any, i: number) => (
                            <div key={i} className="p-5 rounded-3xl bg-red-50/50 border border-red-100 flex flex-col gap-3 group hover:bg-red-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className="p-2 bg-red-100 text-red-600 rounded-xl group-hover:rotate-12 transition-transform">
                                        <AlertCircle className="w-4 h-4" />
                                    </span>
                                    <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase tracking-tighter">Nguy cấp</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-800 line-clamp-1 uppercase">{item.name}</h4>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-xl font-black text-red-600">{item.currentStock}</span>
                                        <span className="text-xs font-bold text-gray-400">{item.unit}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Tối thiểu: {item.minStock} {item.unit}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-300">
                                <CheckCircle2 className="w-12 h-12 mb-2" />
                                <p className="font-bold uppercase text-xs tracking-widest">Kho hàng hiện tại đang ổn định</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
