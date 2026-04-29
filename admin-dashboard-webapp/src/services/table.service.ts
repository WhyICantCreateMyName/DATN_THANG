import api from './axios';
import constants from '../constants';

export interface Table {
    id: string;
    name: string;
    capacity: number;
    status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING';
    qrCode: string | null;
}

export const tableService = {
    getTables: async (params?: { page?: number, limit?: number }): Promise<{ data: Table[], meta: any }> => {
        const queryParams = { ...params, limit: params?.limit || constants.PAGINATION.DEFAULT_LIMIT };
        const res = await api.get('/tables', { params: queryParams });
        return res.data;
    },
    createTable: async (data: Partial<Table>): Promise<Table> => {
        const res = await api.post('/tables', data);
        return res.data;
    },
    updateTable: async (id: string, data: Partial<Table>): Promise<Table> => {
        const res = await api.put(`/tables/${id}`, data);
        return res.data;
    },
    deleteTable: async (id: string): Promise<void> => {
        await api.delete(`/tables/${id}`);
    },
    checkoutTable: async (id: string, orderIds?: string[], paymentMethod: string = 'CASH'): Promise<any> => {
        const res = await api.post(`/tables/${id}/checkout`, { orderIds, paymentMethod });
        return res.data;
    },
    mergeTables: async (sourceTableId: string, targetTableId: string): Promise<any> => {
        const res = await api.post('/tables/merge', { sourceTableId, targetTableId });
        return res.data;
    }
};
