import { createAdminClient } from '@/lib/supabase/admin'
import CategoryPage from '../_components/CategoryPage'

export const dynamic = 'force-dynamic'

export default async function EtcPage() {
  const admin = createAdminClient()

  const { data: dreams } = await admin
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, user_id')
    .eq('category', 'etc')
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

  return (
    <CategoryPage
      title="기타"
      description="분류하기 어려운 독특하고 신비로운 꿈들을 탐색해보세요"
      activePath="/category/etc"
      cards={cards}
    />
  )
}
