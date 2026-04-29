import { Metadata } from 'next';
import ReservationModule from '@/components/ReservationPage/ReservationModule';

export const metadata: Metadata = {
    title: 'Quản Lý Đặt Bàn | Admin Portal',
};

export default function ReservationsPage() {
    return <ReservationModule />;
}
