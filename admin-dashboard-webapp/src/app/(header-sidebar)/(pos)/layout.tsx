'use client';

import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

export default function OperationalLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['ADMIN', 'CASHIER']}>
            {children}
        </RoleGuard>
    );
}
