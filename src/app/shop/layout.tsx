import { createAdminClient } from '@/lib/supabase/admin'
import SiteFooter from '@/components/SiteFooter'
import ShopSidebar from '@/components/ShopSidebar'

interface ShopSubcategoryRow {
  id: string
  name: string
  slug: string
  category_id: string
}

interface ProductCategoryRow {
  shop_category_id: string | null
  shop_subcategory_id: string | null
}

// 공개 화면(굿즈샵)에서 카테고리/하위카테고리를 노출하는 최소 발행 상품 수.
// 상품이 얼마 안 되는 카테고리까지 다 보여주면 사이드바가 휑해 보여서 도입.
// 관리자 화면(/admin/shop-products)에는 적용하지 않는다 — 그쪽은 카테고리를
// 전부 봐야 상품을 채워 넣을 곳을 찾을 수 있기 때문.
const MIN_PRODUCTS_TO_SHOW = 10

export const revalidate = 300

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient()
  const [{ data: categories }, { data: subcategories }, { data: productRows }] = await Promise.all([
    admin
      .from('shop_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('shop_subcategories')
      .select('id, name, slug, category_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('affiliate_products')
      .select('shop_category_id, shop_subcategory_id')
      .eq('is_active', true),
  ])

  // 하위카테고리 상품도 부모의 shop_category_id를 함께 갖고 있으므로(등록 시 항상 같이 저장됨),
  // shop_category_id 기준 카운트만으로 "카테고리 직접 상품 + 하위카테고리 상품 합계"가 된다.
  const categoryCounts: Record<string, number> = {}
  const subcategoryCounts: Record<string, number> = {}
  for (const p of (productRows ?? []) as ProductCategoryRow[]) {
    if (p.shop_category_id) categoryCounts[p.shop_category_id] = (categoryCounts[p.shop_category_id] ?? 0) + 1
    if (p.shop_subcategory_id) subcategoryCounts[p.shop_subcategory_id] = (subcategoryCounts[p.shop_subcategory_id] ?? 0) + 1
  }

  const visibleCategories = (categories ?? []).filter(
    (c) => (categoryCounts[c.id] ?? 0) >= MIN_PRODUCTS_TO_SHOW
  )

  const subcategoriesByCategory: Record<string, { id: string; name: string; slug: string }[]> = {}
  for (const s of (subcategories ?? []) as ShopSubcategoryRow[]) {
    if ((subcategoryCounts[s.id] ?? 0) < MIN_PRODUCTS_TO_SHOW) continue
    if (!subcategoriesByCategory[s.category_id]) subcategoriesByCategory[s.category_id] = []
    subcategoriesByCategory[s.category_id].push({ id: s.id, name: s.name, slug: s.slug })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-[14px] md:flex-row md:items-start">
          <ShopSidebar categories={visibleCategories} subcategoriesByCategory={subcategoriesByCategory} />
          <div className="flex min-w-0 flex-1 flex-col gap-[14px]">{children}</div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
