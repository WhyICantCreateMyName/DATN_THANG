'use client';

import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

export default function CommonLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['ADMIN', 'CASHIER', 'KITCHEN']}>
            {children}
        </RoleGuard>
    );
}
