'use client';

import React, { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import constants from '@/constants';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

/**
 * RoleGuard: Bảo vệ các Route dựa trên vai trò người dùng.
 * @param allowedRoles - Danh sách các role được phép truy cập (VD: ['ADMIN', 'CASHIER'])
 */
export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isLoading } = useAuthContext();
    const router = useRouter();

    console.log(user);

    useEffect(() => {
        if (!isLoading && user) {
            // Nếu role của user không nằm trong danh sách được cho phép
            if (!allowedRoles.includes(user.role)) {
                // Điều hướng về dashboard mặc định của từng role
                if (user.role === 'ADMIN') {
                    router.push(constants.ROUTES.DASHBOARD);
                    console.log("redirect to Admin Page")
                } else if (user.role === 'CASHIER') {
                    router.push(constants.ROUTES.POS);
                    console.log("redirect to Cashier Page")
                } else if (user.role === 'KITCHEN') {
                    router.push(constants.ROUTES.KITCHEN);
                    console.log("redirect to Kitchen Page")
                } else {
                    router.push(constants.ROUTES.LOGIN);
                    console.log("redirect to Login Page")
                }
            }
        }
    }, [user, isLoading, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    // Nếu không có user hoặc role không hợp lệ thì không render gì cả (sẽ được useEffect handle redirect)
    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
