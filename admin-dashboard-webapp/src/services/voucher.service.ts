import axios from 'axios';
import constants from '../constants';

const API_URL = constants.url.api.baseUrl;

export interface Voucher {
    id: string;
    code: string;
    description?: string;
    discountType: 'FIXED' | 'PERCENTAGE';
    discountValue: number;
    maxDiscount?: number;
    minOrderValue: number;
    usageLimit?: number;
    usedCount: number;
    maxUsagePerCustomer?: number;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    conditions: any[];
}

export const voucherService = {
    getVouchers: (page = 1, limit = constants.PAGINATION.DEFAULT_LIMIT) => 
        axios.get(`${API_URL}/vouchers?page=${page}&limit=${limit}`).then(res => res.data),
    
    createVoucher: (data: any) => 
        axios.post(`${API_URL}/vouchers`, data).then(res => res.data),
    
    updateVoucher: (id: string, data: any) => 
        axios.put(`${API_URL}/vouchers/${id}`, data).then(res => res.data),
    
    deleteVoucher: (id: string) => 
        axios.delete(`${API_URL}/vouchers/${id}`).then(res => res.data),
    
    validateVoucher: (code: string, orderValue: number, customerInfo?: { phone?: string }) => 
        axios.post(`${API_URL}/vouchers/validate`, { code, orderValue, customerInfo }).then(res => res.data)
};
