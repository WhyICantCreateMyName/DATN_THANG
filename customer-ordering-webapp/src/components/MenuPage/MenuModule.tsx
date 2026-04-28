'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ChefHat, ShoppingCart, Search, Plus, Minus, X, CheckCircle2, ChevronRight, Hash, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/services/axios';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWidget from '../Chat/ChatWidget';

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    categoryId: string;
    isAvailable: boolean;
}

interface Category {
    id: string;
    name: string;
}

interface CartItem extends MenuItem {
    quantity: number;
    notes: string;
}

interface OrderHistory {
    id: string;
    totalAmount: number;
    status: string;
    items: {
        quantity: number;
        menuItem: MenuItem;
    }[];
}

export default function MenuModule({ qrCode }: { qrCode?: string }) {
    const router = useRouter();
    const [tableName, setTableName] = useState('');
    const [tableId, setTableId] = useState('');
    const [chatSessionId, setChatSessionId] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [initialMessages, setInitialMessages] = useState([]);
    
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        // 1. Load cart from localStorage
        const savedCart = localStorage.getItem('restaurant_customer_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart');
            }
        }

        const storedName = localStorage.getItem('restaurant_table_name');
        const storedId = localStorage.getItem('restaurant_table_id');
        const storedSessionId = localStorage.getItem('restaurant_chat_session_id');
        
        if (storedName) setTableName(storedName);
        if (storedId) setTableId(storedId);
        if (storedSessionId) setChatSessionId(storedSessionId);

        const fetchData = async () => {
            try {
                // 2. Identify table & session if QR code is present
                if (qrCode) {
                    try {
                        const res = await api.get(`/tables/qrcode/${qrCode}`);
                        const { table, chatSession, orders } = res.data.data;
                        
                        if (table) {
                            setTableId(table.id);
                            setTableName(table.name);
                            localStorage.setItem('restaurant_table_id', table.id);
                            localStorage.setItem('restaurant_table_name', table.name);
                        }

                        if (chatSession) {
                            setChatSessionId(chatSession.id);
                            setInitialMessages(chatSession.messages || []);
                            localStorage.setItem('restaurant_chat_session_id', chatSession.id);
                        }

                        if (orders) {
                            setOrderHistory(orders);
                        }
                    } catch (err) {
                        console.error('Failed to identify table from QR');
                        localStorage.removeItem('restaurant_table_id');
                        localStorage.removeItem('restaurant_table_name');
                        localStorage.removeItem('restaurant_chat_session_id');
                        setTableId('');
                        setTableName('');
                    }
                }

                // 3. Fetch categories and items
                const [catRes, itemRes] = await Promise.all([
                    api.get('/categories?limit=50'),
                    api.get('/menu-items?limit=100')
                ]);
                setCategories(catRes.data.data || []);
                setMenuItems(itemRes.data.data || []);
            } catch (error: any) {
                console.error('Fetch error:', error);
            }
        };
        fetchData();
    }, [qrCode]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('restaurant_customer_cart', JSON.stringify(cart));
    }, [cart]);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch && item.isAvailable;
        });
    }, [menuItems, selectedCategoryId, searchTerm]);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1, notes: '' }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const updateNotes = (id: string, notes: string) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handlePlaceOrder = async () => {
        if (!tableId) {
            alert('Vui lòng quét mã QR tại bàn để thực hiện đặt món.');
            return;
        }
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            await api.post('/orders', {
                tableId,
                items: cart.map(i => ({
                    menuItemId: i.id,
                    quantity: i.quantity,
                    notes: i.notes
                }))
            });
            setCart([]);
            setIsCartOpen(false);
            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 5000);
            
            // Refresh history
            if (qrCode) {
               const res = await api.get(`/tables/qrcode/${qrCode}`);
               setOrderHistory(res.data.data.orders);
            }
        } catch (error) {
            alert('Lỗi khi gửi đơn hàng. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pb-32">
            {/* Header */}
            <header className="glass sticky top-0 z-[60] px-6 py-4 flex items-center justify-between border-b border-white/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-gray-800 tracking-tight leading-none mb-1">Thắng Restaurant</h1>
                        <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-amber-600" />
                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Bàn {tableName || '...'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2.5 bg-white rounded-full shadow-md border border-gray-100 active:scale-95 transition-transform"
                    >
                        <ClipboardList className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2.5 bg-white rounded-full shadow-md border border-gray-100 active:scale-95 transition-transform"
                    >
                        <ShoppingCart className="w-6 h-6 text-gray-700" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Banner/Search */}
            <div className="p-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm món ngon bạn thích..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-none outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-gray-700 placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="px-6 flex gap-3 overflow-x-auto pb-6 no-scrollbar sticky top-[73px] bg-gray-50/80 backdrop-blur-md z-40">
                <button
                    onClick={() => setSelectedCategoryId('all')}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategoryId === 'all' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white text-gray-500 border border-gray-100'}`}
                >
                    Tất cả
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white text-gray-500 border border-gray-100'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Menu Items */}
            <div className="px-6 grid gap-6">
                {filteredItems.map((item) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={item.id}
                        className="bg-white rounded-[2rem] p-4 flex gap-4 shadow-sm border border-gray-100 items-center h-32"
                    >
                        <div className="w-24 h-24 rounded-2xl bg-gray-100 shrink-0 overflow-hidden relative">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl.startsWith('http') ? item.imageUrl : `${api.defaults.baseURL}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ChefHat className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1 h-full">
                            <div>
                                <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 font-medium leading-tight">{item.description || 'Hương vị tuyệt hảo từ bếp trưởng.'}</p>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="font-black text-amber-600 text-lg">
                                    {item.price.toLocaleString()}đ
                                </span>
                                <button
                                    onClick={() => addToCart(item)}
                                    className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-md"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chat Widget */}
            {tableId && chatSessionId && (
                <ChatWidget 
                    tableId={tableId} 
                    tableName={tableName} 
                    chatSessionId={chatSessionId} 
                    initialMessages={initialMessages}
                />
            )}

            {/* Success Notification */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-6 right-6 z-[100] bg-green-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-green-500/20"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        <div className="flex-1">
                            <p className="text-sm font-bold">Đặt món thành công!</p>
                            <p className="text-[11px] opacity-90">Đơn hàng hiện đã hiển thị trong lịch sử của bàn.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order History Overlay */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHistoryOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="fixed bottom-0 inset-x-0 bg-white rounded-t-[3rem] z-[80] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-800">Món đã gọi</h2>
                                <button onClick={() => setIsHistoryOpen(false)} className="p-3 bg-gray-50 rounded-full"><X /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {orderHistory.length === 0 ? (
                                    <div className="text-center py-20 text-gray-300">Chưa có món nào được đặt.</div>
                                ) : (
                                    orderHistory.map((order) => (
                                        <div key={order.id} className="bg-gray-50 p-4 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{order.status}</span>
                                                <span className="font-bold text-sm">{order.totalAmount.toLocaleString()}đ</span>
                                            </div>
                                            {order.items.map((it, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{it.menuItem.name} x {it.quantity}</span>
                                                    <span className="font-medium">{(it.quantity * it.menuItem.price).toLocaleString()}đ</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cart Logic (Keep existing) */}
            {totalItems > 0 && !isCartOpen && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-6 left-6 right-6 h-16 bg-gray-900 text-white rounded-full flex items-center justify-between px-6 shadow-2xl z-50 cursor-pointer"
                    onClick={() => setIsCartOpen(true)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center font-bold text-sm">{totalItems}</div>
                        <span className="font-bold text-sm">Xem giỏ hàng</span>
                    </div>
                    <span className="font-black text-amber-500 text-lg">{totalAmount.toLocaleString()}đ</span>
                </motion.div>
            )}

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="fixed bottom-0 inset-x-0 bg-white rounded-t-[3rem] z-[80] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-800">Giỏ hàng của bạn</h2>
                                    <p className="text-sm text-gray-400 font-medium tracking-wide">BÀN {tableName}</p>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><X className="w-6 h-6" /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="flex-1 shrink-0">
                                            <h4 className="font-bold text-gray-800 leading-tight">{item.name}</h4>
                                            
                                            {/* Note Input */}
                                            <div className="mt-2 group">
                                                <div className="flex items-center gap-2 mb-1.5 px-2">
                                                    <div className="w-1 h-3 bg-amber-400 rounded-full" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Ghi chú cho bếp</span>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Ví dụ: Không cay, ít đường..."
                                                    value={item.notes}
                                                    onChange={(e) => updateNotes(item.id, e.target.value)}
                                                    className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-medium text-gray-700 placeholder:text-gray-300 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="flex items-center gap-4 mt-3">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"><Minus size={14} className="text-gray-400"/></button>
                                                <span className="font-bold text-sm text-gray-700">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center text-amber-500 active:scale-95 transition-transform"><Plus size={14}/></button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between py-1">
                                            <span className="font-black text-amber-600">{(item.price * item.quantity).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-gray-50">
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-amber-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-amber-500/30"
                                >
                                    {isSubmitting ? 'ĐANG GỬI...' : `GỬI ĐƠN HÀNG • ${totalAmount.toLocaleString()}đ`}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main>
    );
}
