import LoginForm from '@/components/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Đăng Nhập | Quản Lý Nhà Hàng',
    description: 'Trang đăng nhập hệ thống quản lý nhà hàng',
};

export default function LoginPage() {
    return <LoginForm />;
}
