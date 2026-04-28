import React from 'react';
import MenuModule from '@/components/MenuPage/MenuModule';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thực đơn - Thắng Restaurant',
  description: 'Khám phá thực đơn đa dạng và đặt món trực tuyến ngay tại bàn.',
};

export default async function MenuWithQRPage({ params }: { params: Promise<{ qrCode: string }> }) {
  const { qrCode } = await params;
  return <MenuModule qrCode={qrCode} />;
}
