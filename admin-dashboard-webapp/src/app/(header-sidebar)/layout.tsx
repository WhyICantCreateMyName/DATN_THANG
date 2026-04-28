import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar bên trái */}
            <Sidebar />

            {/* Khung chính chứa Header và Nội dung */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />

                {/* Content bên trong Dashboard */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8 ml-64 transition-all text-gray-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
