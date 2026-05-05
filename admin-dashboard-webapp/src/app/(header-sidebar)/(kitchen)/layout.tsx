'use client';

import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['ADMIN', 'KITCHEN']}>
            {children}
        </RoleGuard>
    );
}
