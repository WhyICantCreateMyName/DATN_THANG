'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
}

export default function Pagination({ page, totalPages, onPageChange, totalItems }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            {totalItems !== undefined && (
                <div className="text-sm text-gray-500">
                    Hiển thị trang <span className="font-bold text-gray-800">{page}</span> / <span className="font-bold text-gray-800">{totalPages}</span> (Tổng {totalItems} bản ghi)
                </div>
            )}
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-gray-100"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                    {/* Render đơn giản trang hiện tại */}
                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-200">
                        {page}
                    </div>
                </div>

                <button 
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-gray-100"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
