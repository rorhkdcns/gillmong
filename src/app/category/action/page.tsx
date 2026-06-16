import { createClient } from '@/lib/supabase/server'
import CategoryPage from '../_components/CategoryPage'

export default async function ActionPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, profiles!left(nickname)')
    .eq('category', 'action')
    .order('created_at', { ascending: false })

  const cards = (data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    body: d.summary,
    grade: d.grade,
    price: d.price,
    is_sold: d.is_sold,
    nickname: (d.profiles as unknown as { nickname: string } | null)?.nickname,
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
