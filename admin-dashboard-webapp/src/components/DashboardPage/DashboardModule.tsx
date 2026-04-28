'use client';

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, CalendarCheck, Percent } from 'lucide-react';
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
        totalTables,
        occupiedTables,
        fillRate,
        totalStaffs
    } = useDashboard();

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Tổng quan Hệ Thống</h1>
                <p className="text-sm text-gray-500 mt-1">Báo cáo hiệu suất kinh doanh hôm nay</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { title: 'Doanh thu trong ngày', value: '14,200,000 ₫', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Công suất lấp đầy', value: `${fillRate}%`, sub: `${occupiedTables}/${totalTables} bàn`, icon: Percent, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { title: 'Tổng Đơn hàng', value: '184', icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { title: 'Nhân sự Active', value: totalStaffs.toString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                            <card.icon className={`w-7 h-7 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{card.value}</h3>
                            {card.sub && <p className="text-xs text-gray-500 mt-1 font-medium">{card.sub}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Biến động Doanh thu</h3>
                            <p className="text-sm text-gray-500">7 ngày gần nhất</p>
                        </div>
                        <select className="bg-gray-50 border border-gray-200 text-sm rounded-xl px-3 py-1.5 outline-none">
                            <option>Tuần này</option>
                            <option>Tuần trước</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dummyRevenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}tr`} />
                                <RechartsTooltip
                                    formatter={(value: any) => [`${Number(value).toLocaleString()} ₫`, 'Doanh thu']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Món bán chạy</h3>
                        <p className="text-sm text-gray-500 mb-6">Theo số lượng order</p>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dummyPopularItems} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 600 }} width={100} />
                                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="orders" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
