import VoucherModule from "@/components/VoucherPage/VoucherModule";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Quản lý Voucher | Restaurant Admin',
    description: 'Quản lý các chương trình khuyến mãi và voucher giảm giá',
};

export default function VouchersPage() {
    return <VoucherModule />;
}
