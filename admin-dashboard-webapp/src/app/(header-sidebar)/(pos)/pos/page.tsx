import { Metadata } from 'next';
import POSModule from '@/components/POSPage/POSModule';

export const metadata: Metadata = {
    title: 'Hệ thống POS | Admin Portal',
    description: 'Xử lý đơn hàng và thanh toán nhanh chóng',
};

export default function POSPage() {
    return <POSModule />;
}
