import React from 'react';
import MenuModule from '@/components/MenuPage/MenuModule';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thực đơn - Thắng Restaurant',
  description: 'Khám phá thực đơn đa dạng với những món ăn tinh hoa được chế biến từ các đầu bếp hàng đầu.',
};

export default function MenuPage() {
  return <MenuModule />;
}
