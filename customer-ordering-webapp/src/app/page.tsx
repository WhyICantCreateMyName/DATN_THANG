import React from 'react';
import HomeModule from '@/components/HomePage/HomeModule';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thắng Restaurant - Đặt món tại bàn',
  description: 'Trải nghiệm ẩm thực tinh hoa, đặt món nhanh chóng và tiện lợi ngay tại bàn của bạn.',
};

export default function HomePage() {
  return <HomeModule />;
}
