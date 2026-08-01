import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories } from '@/lib/categories'
import AllCategoriesPage from './_components/AllCategoriesPage'

export const metadata: Metadata = {
  title: '전체 꿈 보기 - 길몽상점',
  description: '모든 카테고리의 꿈을 한눈에 살펴보세요.',
}

export const revalidate = 60

export default async function CategoryAllPage() {
  const admin = createAdminClient()
  const categories = await getActiveCategories()

  const { data: dreams } = await admin
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, user_id, category_id')
    .eq('is_adult', false)
    .order('created_at', { ascending: false })

  const userIds = [...new Set((dreams ?? []).map((d) => d.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] }
  const nickMap: Record<string, string> = {}
  for (const p of profiles ?? []) nickMap[p.id] = p.nickname

  const categoryById = new Map(categories.map((c) => [c.id, c.slug]))

  const cards = (dreams ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    body: d.summary,
    grade: d.grade,
    price: d.price,
    is_sold: d.is_sold,
    nickname: nickMap[d.user_id],
    categorySlug: categoryById.get(d.category_id) ?? 'etc',
  }))

  return (
    <AllCategoriesPage
      cards={cards}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
    />
  )
}
