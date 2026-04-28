import { Metadata } from 'next';
import MenuModule from '@/components/MenuPage/MenuModule';

export const metadata: Metadata = {
    title: 'Quản lý Thực Đơn | Admin Portal',
    description: 'Thiết lập danh mục và danh sách món ăn',
};

export default function MenuPage() {
    return <MenuModule />;
}
