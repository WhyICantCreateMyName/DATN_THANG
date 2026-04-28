import { Metadata } from 'next';
import DashboardModule from '@/components/DashboardPage/DashboardModule';

export const metadata: Metadata = {
    title: 'Tổng Quan | Admin Portal',
    description: 'Báo cáo thống kê hiệu suất kinh doanh',
};

export default function DashboardPage() {
    return <DashboardModule />;
}
