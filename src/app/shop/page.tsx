import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import SiteFooter from '@/components/SiteFooter'

const BLOCK_SHAPE = 'rounded-[14px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] p-[20px_18px] md:p-[26px_24px]'

export const metadata: Metadata = {
  title: '샵',
  description: '길몽상점이 엄선한 재물운·행운 아이템을 카테고리별로 만나보세요.',
  openGraph: {
    title: '샵 | 길몽상점',
    description: '길몽상점이 엄선한 재물운·행운 아이템을 카테고리별로 만나보세요.',
  },
}

export const revalidate = 300

export default async function ShopPage() {
  const admin = createAdminClient()
  const { data: categories } = await admin
    .from('shop_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="flex min-h-screen flex-col">

      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[600px] flex-col gap-[14px]">

          {/* 작은 히어로 — 메인 홈 히어로(HeroSlider)와는 별개의, 훨씬 작은 고정 배너 */}
          <div className="rounded-[14px] bg-[linear-gradient(150deg,#14547A_0%,#2E7DD1_120%)] px-6 py-6 md:px-8 md:py-7">
            <h1 className="text-2xl font-bold text-white md:text-[28px]">샵</h1>
            <p className="mt-1.5 text-sm text-white/85 md:text-[15px]">
              길몽상점이 엄선한 아이템을 카테고리별로 만나보세요.
            </p>
          </div>

          {/* 카테고리 목록 */}
          <div className={`${BLOCK_SHAPE} bg-white`}>
            {!categories || categories.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#5C6E7C]">등록된 카테고리가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop/${c.slug}`}
                    className="flex items-center justify-center rounded-[10px] border border-[#DCE5EB] bg-white px-4 py-6 text-center text-sm font-semibold text-[#16303F] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
