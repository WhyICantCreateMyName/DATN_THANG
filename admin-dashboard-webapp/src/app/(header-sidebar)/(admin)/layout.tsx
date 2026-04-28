'use client';

import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

export default function AdminOnlyLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['ADMIN']}>
            {children}
        </RoleGuard>
    );
}
