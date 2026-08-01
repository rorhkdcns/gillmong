import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories } from '@/lib/categories'
import CategoryPage from '../_components/CategoryPage'

export const revalidate = 60

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const categories = await getActiveCategories()
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  const admin = createAdminClient()

  const { data: dreams } = await admin
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, user_id')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  const userIds = [...new Set((dreams ?? []).map((d) => d.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] }
  const nickMap: Record<string, string> = {}
  for (const p of profiles ?? []) nickMap[p.id] = p.nickname

  const cards = (dreams ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    body: d.summary,
    grade: d.grade,
    price: d.price,
    is_sold: d.is_sold,
    nickname: nickMap[d.user_id],
  }))

  const otherCategories = categories
    .filter((c) => c.slug !== slug)
    .map((c) => ({ slug: c.slug, name: c.name }))

  return (
    <CategoryPage
      title={category.name}
      description={category.description ?? `${category.name}에 관한 꿈들을 탐색해보세요`}
      activePath={`/category/${slug}`}
      cards={cards}
      otherCategories={otherCategories}
    />
  )
}
