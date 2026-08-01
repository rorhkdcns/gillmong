import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import SiteHeaderGate from "@/components/SiteHeaderGate";
import { getActiveCategories } from "@/lib/categories";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

const SITE_URL = 'https://www.gillmong.com'
const OG_TITLE = '길몽상점 - 꿈을 거래하는 마켓플레이스'
const OG_DESC  = 'AI가 해석한 꿈을 사고파는 P2P 플랫폼. 당신의 꿈을 공유하고, 다른 사람의 꿈을 만나보세요.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: OG_TITLE,
    template: '%s | 길몽상점',
  },
  description: OG_DESC,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    url: SITE_URL,
    siteName: '길몽상점',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '길몽상점 - 꿈을 거래하는 마켓플레이스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: 'AI가 해석한 꿈을 사고파는 P2P 플랫폼',
    images: [`${SITE_URL}/og-image.png`],
  },
  verification: {
    other: {
      "naver-site-verification": "1f9e49922333b3b5f5d1d851ba8ddcd9f1deaaba",
      "daum-verification": "c512cb55bb5601ce7478f908f5bba5d499cdf00740abc1da238ce1806b5a5dff",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 카테고리는 거의 안 바뀌는 데이터라 여기서 한 번(60초 캐시)만 조회해 헤더에 props로 내려준다.
  // (예전엔 SiteHeader가 페이지마다 클라이언트에서 직접 Supabase를 호출했음)
  const categories = await getActiveCategories();

  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeaderGate categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        {children}
      </body>
      <Script
        src="https://pg-web.nicepay.co.kr/js/nicepay-pgweb.js"
        strategy="lazyOnload"
      />
    </html>
  );
}
