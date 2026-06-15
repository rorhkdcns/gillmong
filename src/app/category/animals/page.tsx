import { createClient } from '@/lib/supabase/server'
import CategoryPage from '../_components/CategoryPage'

export default async function AnimalsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('dreams')
    .select('id, title, summary, grade, price, is_sold')
    .eq('category', 'animals')
    .order('created_at', { ascending: false })

  const cards = (data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    body: d.summary,
    grade: d.grade,
    price: d.price,
    is_sold: d.is_sold,
  }))

  return (
    <CategoryPage
      title="동물·식물"
      description="동물, 식물, 자연 생명체가 등장하는 꿈들을 탐색해보세요"
      activePath="/category/animals"
      cards={cards}
    />
  )
}
