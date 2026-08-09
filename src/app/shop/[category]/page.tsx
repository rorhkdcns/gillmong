import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import SiteFooter from '@/components/SiteFooter'
import ShopProductGrid from '@/components/ShopProductGrid'

const BLOCK_SHAPE = 'rounded-[14px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] p-[20px_18px] md:p-[26px_24px]'

interface ShopCategory {
  id: string
  name: string
  slug: string
}

const getCategory = cache(async (slug: string): Promise<ShopCategory | null> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('shop_categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const cat = await getCategory(category)
  if (!cat) return {}

  const title = `${cat.name} - 길몽상점 샵`
  const description = `${cat.name} 카테고리의 추천 상품을 만나보세요.`
  return { title, description, openGraph: { title, description } }
}

export const revalidate = 300

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const cat = await getCategory(category)
  if (!cat) notFound()

  const admin = createAdminClient()
  const [{ data: subcategories }, { data: products }] = await Promise.all([
    admin
      .from('shop_subcategories')
      .select('id, name, slug')
      .eq('category_id', cat.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('affiliate_products')
      .select('id, title, price_text, image_url, link_url')
      .eq('shop_category_id', cat.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <div className="flex min-h-screen flex-col">

      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[600px] flex-col gap-[14px]">

          {/* 작은 히어로 */}
          <div className="rounded-[14px] bg-[linear-gradient(150deg,#14547A_0%,#2E7DD1_120%)] px-6 py-6 md:px-8 md:py-7">
            <nav className="mb-1.5 text-xs text-white/70">
              <Link href="/shop" className="hover:text-white">샵</Link>
              <span className="mx-1.5">›</span>
              <span>{cat.name}</span>
            </nav>
            <h1 className="text-2xl font-bold text-white md:text-[28px]">{cat.name}</h1>
          </div>

          {/* 하위카테고리 칩 */}
          {subcategories && subcategories.length > 0 && (
            <div className={`${BLOCK_SHAPE} bg-white`}>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((s) => (
                  <Link
                    key={s.id}
                    href={`/shop/${cat.slug}/${s.slug}`}
                    className="rounded-full border border-[#DCE5EB] bg-white px-4 py-2 text-sm font-medium text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 상품 그리드 (하위카테고리 무관 이 카테고리 전체) */}
          <ShopProductGrid products={products ?? []} />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
