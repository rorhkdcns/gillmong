import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "길몽상점",
  description: "꿈은 누구에게나 기회와 아이디어가 될 수 있어요",
  verification: {
    other: {
      "naver-site-verification": "1f9e49922333b3b5f5d1d851ba8ddcd9f1deaaba",
      "daum-verification": "c512cb55bb5601ce7478f908f5bba5d499cdf00740abc1da238ce1806b5a5dff",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Script
        src="https://pg-web.nicepay.co.kr/js/nicepay-pgweb.js"
        strategy="lazyOnload"
      />
    </html>
  );
}
