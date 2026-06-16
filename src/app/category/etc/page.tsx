import { createClient } from '@/lib/supabase/server'
import CategoryPage from '../_components/CategoryPage'

export default async function EtcPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, profiles(nickname)')
    .eq('category', 'etc')
    .order('created_at', { ascending: false })

  const cards = (data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    body: d.summary,
    grade: d.grade,
    price: d.price,
    is_sold: d.is_sold,
    nickname: (d.profiles as { nickname: string } | null)?.nickname,
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
