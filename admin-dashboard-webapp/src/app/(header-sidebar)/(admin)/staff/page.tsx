import { Metadata } from 'next';
import StaffModule from '@/components/StaffPage/StaffModule';

export const metadata: Metadata = {
    title: 'Quản lý Nhân Sự | Admin Portal',
    description: 'Bảo mật và phân quyền tài khoản',
};

export default function StaffPage() {
    return <StaffModule />;
}
