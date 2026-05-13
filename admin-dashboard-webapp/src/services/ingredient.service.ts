import axios from 'axios';
import constants from '../constants';

const API_URL = constants.url.api.baseUrl;
const DEFAULT_LIMIT = constants.PAGINATION.DEFAULT_LIMIT;

export interface Ingredient {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    supplierId?: string;
    supplier?: {
        name: string;
    };
}

export interface StockTransaction {
    id: string;
    type: 'IMPORT' | 'EXPORT' | 'AUDIT_START' | 'AUDIT_END';
    quantity: number;
    note?: string;
    createdAt: string;
    ingredient: Ingredient;
    supplier?: {
        name: string;
    };
    user: {
        fullName: string;
    };
}

export interface Supplier {
    id: string;
    name: string;
    contact?: string;
    address?: string;
}

export const ingredientService = {
    // Ingredients
    getAllIngredients: (page = 1, limit = DEFAULT_LIMIT, keyword = '') => 
        axios.get(`${API_URL}/ingredients?page=${page}&limit=${limit}${keyword ? `&keyword=${keyword}` : ''}`).then(res => res.data),
    
    createIngredient: (data: any) => axios.post(`${API_URL}/ingredients`, data).then(res => res.data),
    updateIngredient: (id: string, data: any) => axios.put(`${API_URL}/ingredients/${id}`, data).then(res => res.data),
    deleteIngredient: (id: string) => axios.delete(`${API_URL}/ingredients/${id}`).then(res => res.data),

    // Transactions
    recordTransaction: (data: {
        ingredientId: string;
        type: string;
        quantity: number;
        note?: string;
        userId: string;
        supplierId?: string;
    }) => axios.post(`${API_URL}/ingredients/transaction`, data).then(res => res.data),
    
    getTransactionHistory: (page = 1, limit = DEFAULT_LIMIT) => 
        axios.get(`${API_URL}/ingredients/transactions?page=${page}&limit=${limit}`).then(res => res.data),

    // Suppliers
    getSuppliers: (page = 1, limit = DEFAULT_LIMIT, keyword = '') => 
        axios.get(`${API_URL}/suppliers?page=${page}&limit=${limit}${keyword ? `&keyword=${keyword}` : ''}`).then(res => res.data),
    
    createSupplier: (data: any) => axios.post(`${API_URL}/suppliers`, data).then(res => res.data),
    updateSupplier: (id: string, data: any) => axios.put(`${API_URL}/suppliers/${id}`, data).then(res => res.data),
    deleteSupplier: (id: string) => axios.delete(`${API_URL}/suppliers/${id}`).then(res => res.data)
};
