'use client';

import React from 'react';
import { Utensils, QrCode, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function HomeModule() {
  return (
    <main className="min-h-screen bg-premium flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md flex flex-col items-center text-center z-10 animate-fade-in">
        <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/40 mb-8 rotate-3">
          <Utensils className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Chào mừng bạn đến với <br />
          <span className="text-gradient">Thắng Restaurant</span>
        </h1>

        <div className="flex items-center gap-1 text-amber-500 mb-8">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
          <span className="text-sm text-gray-500 ml-2 font-medium">Ẩm thực tinh hoa</span>
        </div>

        <div className="glass p-8 rounded-[2.5rem] w-full mb-10 shadow-xl border-white/40">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Quét mã tại bàn</h3>
                <p className="text-sm text-gray-500">Mã QR trên bàn giúp chúng tôi phục vụ bạn chính xác và nhanh chóng nhất.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Xem thực đơn & Đặt món</h3>
                <p className="text-sm text-gray-500">Dễ dàng lựa chọn các món ăn yêu thích và đặt món trực tiếp ngay trên điện thoại.</p>
              </div>
            </div>
          </div>
        </div>

        <Link 
          href="/menu"
          className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95 group mb-10"
        >
          Khám phá thực đơn ngay
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <p className="text-sm text-gray-400">
          Vui lòng quét mã QR tại bàn để bắt đầu trải nghiệm đầy đủ
        </p>
      </div>
    </main>
  );
}
