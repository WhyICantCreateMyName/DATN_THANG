import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["vietnamese"] });

export const metadata: Metadata = {
  title: "Đặt món trực tuyến",
  description: "Trải nghiệm ẩm thực tuyệt vời",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
