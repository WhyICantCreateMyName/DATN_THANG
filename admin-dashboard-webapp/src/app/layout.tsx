import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { Metadata } from "next";

const inter = Inter({ subsets: ["vietnamese"] });

export const metadata: Metadata = {
  title: "Admin Dashboard - Restaurant Management",
  description: "Hệ thống quản lý nhà hàng chuyên nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
