import api from './axios';

export interface Invoice {
    id: string;
    subTotal: number;
    tax: number;
    discount: number;
    finalAmount: number;
    isPaid: boolean;
    paymentMethod: string;
    issuedAt: string;
    customerPhone: string;
    customerName: string;
    orderCount: number;
    itemCount: number;
    table: {
        id: string;
        name: string;
    };
    orders: any[]; // Dữ liệu chi tiết đơn hàng nếu cần
}

export interface InvoiceResponse {
    data: Invoice[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const invoiceService = {
    getInvoices: async (params?: {
        startDate?: string;
        endDate?: string;
        minAmount?: number;
        maxAmount?: number;
        customerPhone?: string;
        paymentMethod?: string;
        page?: number;
        limit?: number;
    }): Promise<InvoiceResponse> => {
        const res = await api.get('/invoices', { params });
        return res.data;
    }
};
