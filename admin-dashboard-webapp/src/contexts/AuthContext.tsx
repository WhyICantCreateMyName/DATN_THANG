'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import constants from '../constants';

interface AuthContextProps {
    user: any;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    isLoading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading, logout: authLogout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            const isLoginPage = pathname === constants.ROUTES.LOGIN;

            if (!user) {
                // Nếu chưa login và không ở trang login -> Đẩy về login
                if (!isLoginPage) {
                    router.push(constants.ROUTES.LOGIN);
                }
            } else {
                // Nếu đã login và đang ở trang login -> Đẩy về dashboard tương ứng
                if (isLoginPage) {
                    if (user.role === 'ADMIN') {
                        router.push(constants.ROUTES.DASHBOARD);
                    } else if (user.role === 'CASHIER' || user.role === 'WAITER') {
                        router.push(constants.ROUTES.POS);
                    } else if (user.role === 'KITCHEN') {
                        router.push(constants.ROUTES.KITCHEN);
                    } else {
                        router.push(constants.ROUTES.DASHBOARD);
                    }
                }
            }
            setIsChecking(false);
        }
    }, [user, isLoading, pathname, router]);

    const handleLogout = async () => {
        await authLogout();
        router.push(constants.ROUTES.LOGIN);
    };

    if (isLoading || isChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Nếu đang ở trang login thì render children cho dù chưa login
    if (!user && pathname !== constants.ROUTES.LOGIN) {
        return null; // Không render dashboard nội dung nếu user bị deny
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
