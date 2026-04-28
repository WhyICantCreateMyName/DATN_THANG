import api from './axios';
import constants from '../constants';

export interface User {
    id: string;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'WAITER' | 'KITCHEN' | 'CASHIER';
    isActive: boolean;
    createdAt: string;
}

export const staffService = {
    getStaffs: async (params?: { page?: number, limit?: number }): Promise<{ data: User[], meta: any }> => {
        const queryParams = { ...params, limit: params?.limit || constants.PAGINATION.DEFAULT_LIMIT };
        const res = await api.get('/users', { params: queryParams });
        return res.data;
    },
    createStaff: async (data: any): Promise<{ message: string, userId: string }> => {
        const res = await api.post('/users', data);
        return res.data;
    },
    updateStaff: async (id: string, data: Partial<User>): Promise<{ message: string, userId: string }> => {
        const res = await api.put(`/users/${id}`, data);
        return res.data;
    },
    deleteStaff: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    }
};
