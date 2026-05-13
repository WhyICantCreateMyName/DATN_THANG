'use client';

import React, { useState } from 'react';
import { LayoutGrid, History, Package, Truck, Search } from 'lucide-react';
import { useIngredients, useStockTransactions } from '@/hooks/useIngredients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ingredientService, Ingredient } from '@/services/ingredient.service';
import IngredientList from './parts/IngredientList';
import TransactionHistory from './parts/TransactionHistory';
import StockUpdateModal from './parts/StockUpdateModal';
import SupplierList from './parts/SupplierList';

export default function IngredientModule() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'suppliers'>('inventory');
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

    const { ingredients, meta: ingMeta, page: ingPage, setPage: setIngPage, keyword: ingKeyword, setKeyword: setIngKeyword, isLoading: isIngLoading, mutateIngredients } = useIngredients();
    const { transactions, meta: trMeta, page: trPage, setPage: setTrPage, isLoading: isTrLoading, mutateTransactions } = useStockTransactions();
    const { suppliers, meta: supMeta, page: supPage, setPage: setSupPage, keyword: supKeyword, setKeyword: setSupKeyword, isLoading: isSupLoading, mutateSuppliers } = useSuppliers();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-120px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Unified Header Area */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-xl">
                        <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Quản lý Nguyên liệu & Kho</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Theo dõi tồn kho, hao hụt và chuỗi cung ứng</p>
                    </div>
                </div>

                {/* Tabs Selector in Header */}
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
                            ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        KHO NGUYÊN LIỆU
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
                            ${activeTab === 'suppliers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        <Truck className="w-4 h-4" />
                        NHÀ CUNG CẤP
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
                            ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        <History className="w-4 h-4" />
                        LỊCH SỬ BIẾN ĐỘNG
                    </button>
                </div>
            </div>

            {/* Content Area within Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {activeTab === 'inventory' ? (
                    <IngredientList
                        ingredients={ingredients}
                        suppliers={suppliers}
                        mutateIngredients={mutateIngredients}
                        mutateSuppliers={mutateSuppliers}
                        onUpdateStock={(ing) => { setSelectedIngredient(ing); setIsStockModalOpen(true); }}
                        page={ingPage}
                        meta={ingMeta}
                        onPageChange={setIngPage}
                        keyword={ingKeyword}
                        setKeyword={setIngKeyword}
                    />
                ) : activeTab === 'suppliers' ? (
                    <SupplierList
                        suppliers={suppliers}
                        mutateSuppliers={mutateSuppliers}
                        page={supPage}
                        meta={supMeta}
                        onPageChange={setSupPage}
                        keyword={supKeyword}
                        setKeyword={setSupKeyword}
                    />
                ) : (
                    <TransactionHistory 
                        transactions={transactions} 
                        page={trPage}
                        meta={trMeta}
                        onPageChange={setTrPage}
                    />
                )}
            </div>

            {/* Stock Update Modal remains as it requires more complex inputs */}
            {isStockModalOpen && selectedIngredient && (
                <StockUpdateModal
                    ingredient={selectedIngredient}
                    onClose={() => setIsStockModalOpen(false)}
                    onSuccess={() => {
                        setIsStockModalOpen(false);
                        mutateIngredients();
                        mutateTransactions();
                    }}
                />
            )}
        </div>
    );
}
