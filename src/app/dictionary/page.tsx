import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import DictionaryFilterList from './_components/DictionaryFilterList'

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
  const { data: entries } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary, tags')
    .eq('is_published', true)
    .order('keyword', { ascending: true })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[600px] flex-col gap-[14px]">
          <div className="text-center">
            <h1 className="mb-2 text-[26px] font-medium text-[#0B2433] md:text-[32px]">꿈해몽 사전</h1>
            <p className="text-[15px] text-[#5C6E7C]">
              자주 검색되는 꿈 키워드를 한국 전통·동양·서양 심리학 관점으로 풀이했습니다.
            </p>
          </div>

          <DictionaryFilterList entries={entries ?? []} />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
