import { createAdminClient } from '@/lib/supabase/admin'
import CategoryPage from '../_components/CategoryPage'

export const dynamic = 'force-dynamic'

export default async function ActionPage() {
  const admin = createAdminClient()

  const { data: dreams } = await admin
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, user_id')
    .eq('category', 'action')
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
      title="행동·상황"
      description="특별한 행동이나 상황이 펼쳐지는 꿈들을 탐색해보세요"
      activePath="/category/action"
      cards={cards}
    />
  )
}
