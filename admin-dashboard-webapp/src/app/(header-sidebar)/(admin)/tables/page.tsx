import { Metadata } from 'next';
import TableModule from '@/components/TablePage/TableModule';

export const metadata: Metadata = {
    title: 'Sơ đồ Bàn | Admin Portal',
    description: 'Quản lý, tạo mã QR và thay đổi cấu trúc bàn.',
};

export default function TablePage() {
    return <TableModule />;
}
