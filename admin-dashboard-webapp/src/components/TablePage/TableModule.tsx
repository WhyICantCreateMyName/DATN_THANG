'use client';

import React, { useState, useRef } from 'react';
import { Plus, Trash2, QrCode as QrIcon, Download, LibrarySquare, Check, X, Edit2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTable } from '@/hooks/useTable';
import { tableService, Table } from '@/services/table.service';
import constants from '@/constants';

interface TableUI extends Table {
    isEdit?: boolean;
    isCreate?: boolean;
}

export default function TableModule() {
    const { tables, meta, page, setPage, mutateTables } = useTable();
    const [localTables, setLocalTables] = React.useState<TableUI[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const qrRefs = useRef<{ [key: string]: SVGSVGElement | null }>({});

    // Sync SWR data to local state
    React.useEffect(() => {
        if (tables) {
            // Only sync if we are not in the middle of creating or editing
            if (!isCreating && !editingId) {
                setLocalTables(tables);
            }
        }
    }, [tables, isCreating, editingId]);

    const handleAddTable = () => {
        if (isCreating) return; // Prevent multiple temp tables

        setIsCreating(true);
        const tempTable: TableUI = {
            id: `temp-${Date.now()}`,
            name: '',
            capacity: 6,
            status: 'AVAILABLE',
            qrCode: '',
            isCreate: true
        };
        setLocalTables([tempTable, ...localTables]);
    };

    const handleEditTable = (id: string) => {
        setEditingId(id);
        setLocalTables(prev => prev.map(t =>
            t.id === id ? { ...t, isEdit: true } : t
        ));
    };

    const handleCancel = (id: string, isCreate?: boolean) => {
        if (isCreate) {
            setIsCreating(false);
            setLocalTables(prev => prev.filter(t => t.id !== id));
        } else {
            setEditingId(null);
            setLocalTables(prev => prev.map(t =>
                t.id === id ? { ...tables?.find(orig => orig.id === id)!, isEdit: false } : t
            ));
        }
    };

    const handleInputChange = (id: string, field: keyof Table, value: any) => {
        setLocalTables(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const handleSave = async (table: TableUI) => {
        if (!table.name.trim()) return alert('Vui lòng nhập tên bàn');

        setIsSaving(true);
        try {
            if (table.isCreate) {
                const qrCode = `QR_${table.name.replace(/\s+/g, '').toUpperCase()}_${Date.now()}`;
                await tableService.createTable({
                    name: table.name,
                    capacity: table.capacity,
                    qrCode
                });
            } else {
                await tableService.updateTable(table.id, {
                    name: table.name,
                    capacity: table.capacity
                });
            }
            // Reset state and refetch
            setIsCreating(false);
            setEditingId(null);
            setLocalTables(prev => prev.map(t => ({ ...t, isEdit: false, isCreate: false })));
            await mutateTables();
        } catch (error) {
            alert('Lỗi khi lưu thông tin bàn');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTable = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xoá ${name}?`)) return;
        try {
            await tableService.deleteTable(id);
            await mutateTables();
        } catch (error) {
            alert('Lỗi khi xoá bàn');
        }
    };

    const downloadQR = (tableId: string, tableName: string) => {
        const svg = qrRefs.current[tableId];
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 80;

            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.fillText(tableName, canvas.width / 2, canvas.height - 20);
            }

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `QR_${tableName.replace(/\s+/g, '_')}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-700 border-green-200';
            case 'OCCUPIED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'RESERVED': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'CLEANING': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'Bàn Trống';
            case 'OCCUPIED': return 'Có Khách';
            case 'RESERVED': return 'Đã Đặt';
            case 'CLEANING': return 'Đang Dọn';
            default: return status;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Quản lý Bàn & QR Code</h2>
                    <p className="text-sm text-gray-500 mt-1">Sơ đồ bố trí và mã quét đặt món điện tử</p>
                </div>
                <button
                    onClick={handleAddTable}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Bàn
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {localTables.map(table => (
                        <div key={table.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center group relative pt-8">
                            <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-2xl ${table.status === 'AVAILABLE' ? 'bg-green-500' :
                                table.status === 'OCCUPIED' ? 'bg-blue-500' :
                                    table.status === 'RESERVED' ? 'bg-orange-500' : 'bg-gray-400'
                                }`}></div>

                            <div className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-md border font-semibold ${getStatusStyle(table.status)}`}>
                                {getStatusLabel(table.status)}
                            </div>

                            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {!table.isEdit && !table.isCreate && (
                                    <>
                                        <button onClick={() => handleEditTable(table.id)} className="p-1.5 hover:bg-blue-50 text-blue-400 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteTable(table.id, table.name)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {table.isEdit || table.isCreate ? (
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSave(table); }}
                                    className="w-full space-y-3 mt-2"
                                >
                                    <input
                                        autoFocus
                                        className="w-full px-3 py-2 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold text-gray-800"
                                        placeholder="Tên bàn..."
                                        value={table.name}
                                        onChange={(e) => handleInputChange(table.id, 'name', e.target.value)}
                                    />
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs text-gray-400">Sức chứa:</span>
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1.5 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm font-bold text-gray-800 bg-blue-50/30"
                                            value={table.capacity}
                                            onChange={(e) => handleInputChange(table.id, 'capacity', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-center pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md shadow-green-500/20 disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancel(table.id, table.isCreate)}
                                            className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <h3 className="text-xl font-extrabold text-gray-800 mt-2">Bàn {table.name.length === 1 ? `0${table.name}` : table.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{table.capacity} Ghế ngồi</p>

                                    <div className="mt-6 mb-4 p-3 bg-gray-50 rounded-xl relative group/qr">
                                        {table.qrCode ? (
                                            <>
                                                <QRCodeSVG
                                                    value={`${constants.url.client.baseUrl}${constants.url.client.order(table.qrCode)}`}
                                                    size={120}
                                                    level="M"
                                                    includeMargin={true}
                                                    ref={(el) => { qrRefs.current[table.id] = el; }}
                                                />
                                                <button
                                                    onClick={() => downloadQR(table.id, table.name)}
                                                    className="absolute inset-0 bg-blue-600/80 backdrop-blur-[1px] text-white rounded-xl flex-col items-center justify-center gap-2 opacity-0 group-hover/qr:opacity-100 transition-opacity flex"
                                                >
                                                    <Download className="w-6 h-6" />
                                                    <span className="text-xs font-semibold">Tải ảnh QR</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-[120px] h-[120px] flex items-center justify-center text-gray-400">
                                                <QrIcon className="w-12 h-12 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest break-all text-center px-2">
                                        {table.qrCode || 'Chưa thiết lập QR'}
                                    </p>
                                </>
                            )}
                        </div>
                    ))}

                    {tables?.length === 0 && (
                        <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-gray-400">
                            <LibrarySquare className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Chưa có bàn nào trong hệ thống</p>
                            <p className="text-sm mt-1">Hãy nhấn "Thêm Bàn" để bắt đầu bố trí sơ đồ.</p>
                        </div>
                    )}
                </div>

                {meta && meta.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium">Trang trước</button>
                        <span className="text-sm font-medium text-gray-500">Trang {page} / {meta.totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium">Trang sau</button>
                    </div>
                )}
            </div>
        </div>
    );
}
