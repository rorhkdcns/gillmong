import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ShopProductGrid from '@/components/ShopProductGrid'

interface ShopCategory {
  id: string
  name: string
  slug: string
}
interface ShopSubcategory {
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

const getSubcategory = cache(async (categoryId: string, slug: string): Promise<ShopSubcategory | null> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('shop_subcategories')
    .select('id, name, slug')
    .eq('category_id', categoryId)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; sub: string }>
}): Promise<Metadata> {
  const { category, sub } = await params
  const cat = await getCategory(category)
  if (!cat) return {}
  const subcat = await getSubcategory(cat.id, sub)
  if (!subcat) return {}

  const title = `${subcat.name} - 길몽상점 굿즈샵`
  const description = `${cat.name} > ${subcat.name} 카테고리의 추천 상품을 만나보세요.`
  return { title, description, openGraph: { title, description } }
}

export const revalidate = 300

export default async function ShopSubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; sub: string }>
}) {
  const { category, sub } = await params
  const cat = await getCategory(category)
  if (!cat) notFound()
  const subcat = await getSubcategory(cat.id, sub)
  if (!subcat) notFound()

  const admin = createAdminClient()
  const { data: products } = await admin
    .from('affiliate_products')
    .select('id, title, price_text, image_url, link_url')
    .eq('shop_subcategory_id', subcat.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <>
      {/* 작은 히어로 */}
      <div className="rounded-[14px] bg-[linear-gradient(150deg,#14547A_0%,#2E7DD1_120%)] px-6 py-6 md:px-8 md:py-7">
        <nav className="mb-1.5 text-xs text-white/70">
          <Link href="/shop" className="hover:text-white">굿즈샵</Link>
          <span className="mx-1.5">›</span>
          <Link href={`/shop/${cat.slug}`} className="hover:text-white">{cat.name}</Link>
          <span className="mx-1.5">›</span>
          <span>{subcat.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-white md:text-3xl">{subcat.name}</h1>
        <p className="mt-1 text-xs text-white/70">{(products ?? []).length}개 상품</p>
      </div>

      {/* 상품 그리드 */}
      <ShopProductGrid products={products ?? []} />
    </>
  )
}
