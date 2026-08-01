import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories } from '@/lib/categories'
import DictionaryList from './_components/DictionaryList'

export const metadata: Metadata = {
  title: '꿈해몽 사전',
  description: '자주 검색되는 꿈 키워드를 한국 전통·동양·서양 심리학 관점으로 풀이한 해몽 사전. 궁금한 꿈을 검색해보세요.',
  openGraph: {
    title: '꿈해몽 사전 | 길몽상점',
    description: '자주 검색되는 꿈 키워드를 한국 전통·동양·서양 심리학 관점으로 풀이한 해몽 사전.',
  },
}

export const dynamic = 'force-dynamic'

export default async function DictionaryPage() {
  const admin = createAdminClient()

  const [{ data: entries }, categories] = await Promise.all([
    admin
      .from('dictionary_entries')
      .select('slug, keyword, summary, category_slug, tags')
      .eq('is_published', true)
      .order('keyword', { ascending: true }),
    getActiveCategories(),
  ])

  const categoryNameMap: Record<string, string> = {}
  for (const c of categories) categoryNameMap[c.slug] = c.name

  return <DictionaryList entries={entries ?? []} categoryNameMap={categoryNameMap} />
}
