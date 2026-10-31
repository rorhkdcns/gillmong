import { createAdminClient } from '@/lib/supabase/admin'
import DreamInput from './_components/DreamInput'
import SiteFooter from '@/components/SiteFooter'
import BannerSlider from '@/components/BannerSlider'
import MobileQuickMenu from '@/components/MobileQuickMenu'
import HomeHero from '@/components/home/HomeHero'
import RecentTicker from '@/components/home/RecentTicker'
import GradeStrip from '@/components/home/GradeStrip'
import DreamMarket from '@/components/home/DreamMarket'
import FortuneBanner from '@/components/home/FortuneBanner'
import { getActiveCategories } from '@/lib/categories'

export const revalidate = 60

export default async function Home() {
  const supabase = createAdminClient()
  const categories = await getActiveCategories()

  // 배너 + 카테고리별 꿈 병렬 조회
  const [{ data: activeBanners }, ...categoryResults] = await Promise.all([
    supabase
      .from('banners')
      .select('id, image_url, link_url')
      .eq('is_active', true)
      .order('order', { ascending: true }),
    ...categories.map(({ id }) =>
      supabase
        .from('dreams')
        .select('id, title, summary, grade, price, user_id, created_at')
        .eq('category_id', id)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })
        .limit(8)
    ),
  ])

  // 모든 카테고리의 user_id 수집 → 프로필 한 번에 조회
  const allDreams = categoryResults.flatMap((r) => r.data ?? [])
  const userIds   = [...new Set(allDreams.map((d) => d.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] }

  const nickMap: Record<string, string> = {}
  for (const p of profiles ?? []) nickMap[p.id] = p.nickname

  const categoryDreams = categoryResults.map((r) =>
    (r.data ?? []).map((d) => ({
      id:       d.id,
      title:    d.title,
      body:     d.summary,
      grade:    d.grade,
      price:    d.price,
      is_sold:  false,
      nickname: nickMap[d.user_id] ?? null,
      created_at: d.created_at as string,
    }))
  )
  // 전체 탭: 모든 카테고리를 합쳐 최신순
  const merged = categoryDreams
    .flat()
    .sort((x, y) => (y.created_at > x.created_at ? 1 : -1))
  const ticker = merged.slice(0, 12).map((d) => ({ id: d.id, title: d.title, grade: d.grade }))

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">

      {/* ① 배너 (관리자 등록 이미지 배너) */}
      <BannerSlider banners={activeBanners ?? []} />

      {/* ① 히어로 */}
      <HomeHero />

      {/* ①-1 방금 감정된 꿈 */}
      <RecentTicker items={ticker} />

      {/* ①-2 모바일 퀵메뉴 */}
      <div className="px-4 pt-4 md:hidden">
        <div className="rounded-[4px] border border-brand-line bg-white">
          <MobileQuickMenu />
        </div>
      </div>

      {/* ② 등급 안내 (한 줄) */}
      <GradeStrip />

      {/* ③ 지금 팔고 있는 꿈 */}
      <DreamMarket tabs={categories.map(({ slug, name }) => ({ slug, name }))} dreamsByTab={categoryDreams} all={merged} />

      {/* ④ 꿈 감정소 */}
      <section id="appraisal" className="scroll-mt-20 border-t border-brand-line bg-white px-6 py-16">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-[4px] border border-brand-line bg-brand-page p-6 md:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-brand-ink md:text-4xl">꿈 감정소</h2>
              <p className="mt-2 text-sm font-medium text-brand-ink-soft">꿈을 적으면 등급과 해몽, 행운 번호가 나와요</p>
            </div>
            <DreamInput />
          </div>
        </div>
      </section>

      {/* ⑤ 운세 배너 */}
      <FortuneBanner />

      <SiteFooter />
    </div>
  )
}
