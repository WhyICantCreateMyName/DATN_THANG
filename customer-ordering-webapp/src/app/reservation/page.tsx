import { Metadata } from 'next';
import ReservationModule from '@/components/ReservationPage/ReservationModule';

export const metadata: Metadata = {
    title: 'Đặt Bàn Trực Tuyến | Thắng Restaurant',
    description: 'Đặt bàn trước để có chỗ ngồi ưng ý và trải nghiệm phục vụ tốt nhất.',
};

export default function ReservationPage() {
    return <ReservationModule />;
}
