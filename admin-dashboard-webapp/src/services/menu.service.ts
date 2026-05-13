import api from './axios';
import constants from '../constants';

export interface Category {
    id: string;
    name: string;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    categoryId: string;
}

export const menuService = {
    // ---- Categories ----
    getCategories: async (params?: { page?: number, limit?: number, keyword?: string }): Promise<{ data: Category[], meta: any }> => {
        const queryParams = { ...params, limit: params?.limit || constants.PAGINATION.DEFAULT_LIMIT };
        const res = await api.get('/categories', { params: queryParams });
        return res.data;
    },
    createCategory: async (name: string): Promise<Category> => {
        const res = await api.post('/categories', { name });
        return res.data;
    },
    updateCategory: async (id: string, name: string): Promise<Category> => {
        const res = await api.put(`/categories/${id}`, { name });
        return res.data;
    },
    deleteCategory: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },

    // ---- Menu Items ----
    getMenuItems: async (params?: { page?: number, limit?: number, categoryId?: string | null, keyword?: string }): Promise<{ data: (MenuItem & { category: Category })[], meta: any }> => {
        const queryParams = { ...params, limit: params?.limit || constants.PAGINATION.DEFAULT_LIMIT };
        if (queryParams.categoryId === null) delete queryParams.categoryId;
        const res = await api.get('/menu-items', { params: queryParams });
        return res.data;
    },
    createMenuItem: async (data: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
        const res = await api.post('/menu-items', data);
        return res.data;
    },
    updateMenuItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
        const res = await api.put(`/menu-items/${id}`, data);
        return res.data;
    },
    deleteMenuItem: async (id: string): Promise<void> => {
        await api.delete(`/menu-items/${id}`);
    },

    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.url;
    }
};
