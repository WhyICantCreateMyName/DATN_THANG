'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/axios';

interface Customer {
    id: string;
    phone: string;
    name?: string;
}

interface AuthContextType {
    customer: Customer | null;
    isLoading: boolean;
    login: (phone: string, name?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('customer_token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // Set default auth header
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await api.get('/customers/me');
                setCustomer(res.data);
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('customer_token');
                delete api.defaults.headers.common['Authorization'];
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (phone: string, name?: string) => {
        try {
            const res = await api.post('/customers/login', { phone, name });
            const { token, customer: customerData } = res.data;
            
            localStorage.setItem('customer_token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setCustomer(customerData);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('customer_token');
        delete api.defaults.headers.common['Authorization'];
        setCustomer(null);
    };

    return (
        <AuthContext.Provider value={{ customer, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
