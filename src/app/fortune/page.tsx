import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import SiteFooter from '@/components/SiteFooter'
import { getKSTDateString } from '@/lib/fortune'
import FortuneTabs from './_components/FortuneTabs'

export const metadata: Metadata = {
  title: '오늘의 운세',
  description: '띠와 별자리로 보는 오늘 하루의 운세. 태어난 연도나 생일을 입력하면 자동으로 찾아드려요.',
  openGraph: {
    title: '오늘의 운세 | 길몽상점',
    description: '띠와 별자리로 보는 오늘 하루의 운세.',
  },
}

export const revalidate = 300

export default async function FortunePage() {
  const admin = createAdminClient()
  const today = getKSTDateString()

  const { data } = await admin
    .from('daily_fortunes')
    .select('type, key, content')
    .eq('fortune_date', today)

  const zodiacFortunes: Record<string, string> = {}
  const starFortunes: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.type === 'zodiac') zodiacFortunes[row.key] = row.content
    else if (row.type === 'star') starFortunes[row.key] = row.content
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[680px] flex-col gap-[14px]">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-medium text-[#0B2433] md:text-3xl">오늘의 운세</h1>
            <p className="text-sm text-[#5C6E7C]">{today} · 띠와 별자리로 보는 오늘 하루</p>
          </div>

          <FortuneTabs date={today} zodiacFortunes={zodiacFortunes} starFortunes={starFortunes} />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
