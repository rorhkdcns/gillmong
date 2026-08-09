import { createAdminClient } from '@/lib/supabase/admin'
import SiteFooter from '@/components/SiteFooter'
import ShopSidebar from '@/components/ShopSidebar'

interface ShopSubcategoryRow {
  id: string
  name: string
  slug: string
  category_id: string
}

export const revalidate = 300

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient()
  const [{ data: categories }, { data: subcategories }] = await Promise.all([
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
  ])

  const subcategoriesByCategory: Record<string, { id: string; name: string; slug: string }[]> = {}
  for (const s of (subcategories ?? []) as ShopSubcategoryRow[]) {
    if (!subcategoriesByCategory[s.category_id]) subcategoriesByCategory[s.category_id] = []
    subcategoriesByCategory[s.category_id].push({ id: s.id, name: s.name, slug: s.slug })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-[14px] md:flex-row md:items-start">
          <ShopSidebar categories={categories ?? []} subcategoriesByCategory={subcategoriesByCategory} />
          <div className="flex min-w-0 flex-1 flex-col gap-[14px]">{children}</div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
