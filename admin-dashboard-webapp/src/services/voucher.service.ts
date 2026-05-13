import api from './axios';
import constants from '../constants';

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
    getVouchers: (page = 1, limit = constants.PAGINATION.DEFAULT_LIMIT, keyword = '') => 
        api.get(`/vouchers?page=${page}&limit=${limit}${keyword ? `&keyword=${keyword}` : ''}`).then(res => res.data),
    
    createVoucher: (data: any) => 
        api.post(`/vouchers`, data).then(res => res.data),
    
    updateVoucher: (id: string, data: any) => 
        api.put(`/vouchers/${id}`, data).then(res => res.data),
    
    deleteVoucher: (id: string) => 
        api.delete(`/vouchers/${id}`).then(res => res.data),
    
    validateVoucher: (code: string, orderValue: number, customerInfo?: { phone?: string }) => 
        api.post(`/vouchers/validate`, { code, orderValue, customerInfo }).then(res => res.data)
};
