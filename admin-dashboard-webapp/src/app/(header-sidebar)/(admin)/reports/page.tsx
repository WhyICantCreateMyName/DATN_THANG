import { Metadata } from 'next';
import ReportModule from '@/components/ReportPage/ReportModule';

export const metadata: Metadata = {
    title: 'Báo cáo Doanh thu | Admin Portal',
    description: 'Thống kê chi tiết doanh thu và hóa đơn',
};

export default function ReportPage() {
    return <ReportModule />;
}
