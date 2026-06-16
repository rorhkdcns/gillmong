import { createClient } from '@/lib/supabase/server'
import CategoryPage from '../_components/CategoryPage'

export default async function NaturePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold, profiles(nickname)')
    .eq('category', 'nature')
    .eq('is_public', true)
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
      title="자연·사물"
      description="자연 현상과 사물이 등장하는 꿈들을 탐색해보세요"
      activePath="/category/nature"
      cards={cards}
    />
  )
}
