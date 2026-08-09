import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import ShopProductGrid from '@/components/ShopProductGrid'

export const metadata: Metadata = {
  title: '굿즈샵',
  description: '길몽상점이 엄선한 재물운·행운 아이템을 카테고리별로 만나보세요.',
  openGraph: {
    title: '굿즈샵 | 길몽상점',
    description: '길몽상점이 엄선한 재물운·행운 아이템을 카테고리별로 만나보세요.',
  },
}

export const revalidate = 300

export default async function ShopPage() {
  const admin = createAdminClient()
  const { data: products } = await admin
    .from('affiliate_products')
    .select('id, title, price_text, image_url, link_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <>
      {/* 작은 히어로 — 메인 홈 히어로(HeroSlider)와는 별개의, 훨씬 작은 고정 배너 */}
      <div className="rounded-[14px] bg-[linear-gradient(150deg,#14547A_0%,#2E7DD1_120%)] px-6 py-6 md:px-8 md:py-7">
        <h1 className="text-2xl font-bold text-white md:text-[28px]">굿즈샵</h1>
        <p className="mt-1.5 text-sm text-white/85 md:text-[15px]">
          길몽상점이 엄선한 아이템을 카테고리별로 만나보세요.
        </p>
      </div>

      <ShopProductGrid products={products ?? []} />
    </>
  )
}
