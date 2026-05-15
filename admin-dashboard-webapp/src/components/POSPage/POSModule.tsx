'use client';

import React, { useEffect } from 'react';
import { usePOS } from '@/hooks/usePOS';
import TableMap from './parts/TableMap';
import OrderPanel from './parts/OrderPanel';
import CheckoutPanel from './parts/CheckoutPanel';
import OrderActions from './parts/OrderActions';
import ChatPanel from './parts/ChatPanel';
import PaymentQRModal from './parts/PaymentQRModal';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';

export default function POSModule() {
    const searchParams = useSearchParams();
    const tableIdFromUrl = searchParams.get('tableId');

    const {
        selectedTableId, setSelectedTableId,
        unreadTables, markTableAsRead,
        selectedOrderIds, toggleOrderSelection,
        paymentUrl, setPaymentUrl,
        paymentMethod, setPaymentMethod,
        isPaymentSuccess,
        tables, isTablesLoading,
        activeOrders, isOrdersLoading,
        waitingOrders,
        selectedTable,
        handleApprove, handleCancel, handleUpdateStatus, handleCheckout, handleMoveOrder, handleMergeTables,
        calculateTotal,
        mutateTables, mutateWaitingOrders,
        mutateReservations,
        activeReservations
    } = usePOS();

    // Reset bàn đang chọn khi thoát khỏi màn hình POS (Tránh việc tự động đọc tin nhắn khi đang ở trang khác)
    useEffect(() => {
        return () => {
            setSelectedTableId(null);
        };
    }, [setSelectedTableId]);

    // Tự động chọn bàn nếu có ID từ URL (Ví dụ: từ thông báo đẩy)
    useEffect(() => {
        if (tableIdFromUrl) {
            setSelectedTableId(tableIdFromUrl);
        }
    }, [tableIdFromUrl, setSelectedTableId]);

    const hasNewOrder = (id: string) => waitingOrders.some(o => o.tableId === id);
    console.log("payment url", paymentUrl);

    return (
        <div className="flex h-[calc(100vh-160px)] gap-6 overflow-hidden">

            {/* PHẦN 1: SƠ ĐỒ BÀN (30% chiều rộng) */}
            <div className="w-[30%] min-w-[320px]">
                <TableMap
                    tables={tables || []}
                    reservations={activeReservations}
                    selectedTableId={selectedTableId}
                    onSelectTable={setSelectedTableId}
                    onRefresh={() => { mutateTables(); mutateWaitingOrders(); mutateReservations(); }}
                    tableHasNewOrder={hasNewOrder}
                    unreadTables={unreadTables}
                    isLoading={isTablesLoading}
                />
            </div>

            {/* PHẦN 2 & 3: CHI TIẾT ĐƠN HÀNG & CHAT (70% chiều rộng) */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
                {selectedTableId && selectedTable ? (
                    <div className="flex h-full overflow-hidden">
                        {/* Cột giữa: Đơn hàng */}
                        <div className="flex-1 flex flex-col border-r border-gray-100 min-w-[400px] relative">
                            {/* Action Bar Nâng cao */}
                            <div className="absolute top-6 right-8 z-20 flex gap-2">
                                {activeOrders.length > 0 && tables && (
                                    <OrderActions
                                        tables={tables}
                                        currentTableId={selectedTableId}
                                        orderId={activeOrders[0]?.id}
                                        onMove={(target) => handleMoveOrder(activeOrders[0]?.id, target)}
                                        onMerge={handleMergeTables}
                                    />
                                )}
                            </div>

                            <OrderPanel
                                table={selectedTable}
                                orders={activeOrders}
                                isLoading={isOrdersLoading}
                                onApprove={handleApprove}
                                onCancel={handleCancel}
                                onUpdateStatus={handleUpdateStatus}
                                selectedOrderIds={selectedOrderIds}
                                onToggleSelect={toggleOrderSelection}
                            />

                            <CheckoutPanel
                                totals={calculateTotal()}
                                canCheckout={selectedTable.status === 'OCCUPIED'}
                                onCheckout={(method: string) => handleCheckout(method)}
                                isPartial={selectedOrderIds.length > 0}
                            />
                        </div>

                        {/* Cột phải: Chat với khách */}
                        <div className="w-[350px] flex-shrink-0">
                            <ChatPanel tableId={selectedTableId} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-20 text-center">
                        <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-6">
                            <LayoutGrid className="w-12 h-12 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hệ thống POS</h3>
                        <p className="font-medium text-sm leading-relaxed max-w-xs">Chọn bàn để xử lý đơn hàng, trò chuyện với khách hoặc thanh toán hóa đơn.</p>
                    </div>
                )}
            </div>

            {/* Modal hiển thị mã QR Thanh toán */}
            {paymentUrl && (
                <PaymentQRModal
                    url={paymentUrl}
                    onClose={() => setPaymentUrl(null)}
                    tableName={selectedTable?.name}
                    isSuccess={isPaymentSuccess}
                    method={paymentMethod === 'MOMO' ? 'MOMO' : 'VNPAY'}
                />
            )}
        </div>
    );
}
