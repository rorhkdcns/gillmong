import { createClient } from '@/lib/supabase/server'
import CategoryPage from '../_components/CategoryPage'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, profiles(nickname)')
    .eq('category', 'people')
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
      title="인물·신체"
      description="사람, 몸, 표정에 관한 꿈들을 탐색해보세요"
      activePath="/category/people"
      cards={cards}
    />
  )
}
