import { createAdminClient } from '@/lib/supabase/admin'
import DreamInput from './_components/DreamInput'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import BannerSlider from '@/components/BannerSlider'
import HeroSlider from '@/components/HeroSlider'
import CategoryCarousel from '@/components/CategoryCarousel'
import { GRADE_GUIDE_LIST } from '@/lib/dreamDisplay'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  { slug: 'people',  label: '인물·신체' },
  { slug: 'animals', label: '동물·식물' },
  { slug: 'nature',  label: '자연·사물' },
  { slug: 'action',  label: '행동·상황' },
  { slug: 'etc',     label: '기타' },
]

export default async function Home() {
  const supabase = createAdminClient()

  // 배너 + 5개 카테고리 병렬 조회
  const [{ data: activeBanners }, ...categoryResults] = await Promise.all([
    supabase
      .from('banners')
      .select('id, image_url, link_url')
      .eq('is_active', true)
      .order('order', { ascending: true }),
    ...CATEGORIES.map(({ slug }) =>
      supabase
        .from('dreams')
        .select('id, title, summary, grade, price, user_id')
        .eq('category', slug)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })
        .limit(10)
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
    }))
  )

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <SiteHeader />

      {/* ① 배너 (관리자 등록 이미지 배너) */}
      <BannerSlider banners={activeBanners ?? []} />

      {/* ① 히어로 슬라이더 */}
      <HeroSlider />

      {/* ② 꿈 감정소 */}
      <section id="appraisal" className="px-6 pb-20 pt-16">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-brand-line bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black text-brand-ink">꿈 감정소</h2>
              <p className="mt-2 text-base font-medium text-brand-ink-soft">Dream Appraisal Center</p>
            </div>
            <DreamInput />
          </div>
        </div>
      </section>

      {/* ②-b 등급 안내 */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-10 flex justify-center">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-brand-ink shadow-xl md:h-32 md:w-32">
              <span className="mb-1 text-lg text-brand-gold">☆</span>
              <span className="text-[10px] tracking-widest text-brand-gold">EXCEL</span>
              <span className="text-[10px] text-white/80">GILLMONG</span>
              <span className="text-sm text-white">GRADE</span>
            </div>
          </div>
          <h2 className="mb-8 text-2xl font-black text-brand-ink md:text-3xl">등급 안내</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
            {GRADE_GUIDE_LIST.map((g) => (
              <div key={g.grade} className="flex flex-col items-center rounded-2xl bg-brand-page p-5 text-center shadow-sm">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white shadow ${g.badgeBg}`}>
                  {g.grade}
                </div>
                <p className="mb-1 text-sm font-semibold text-brand-ink">{g.rank}</p>
                <p className="text-xs leading-relaxed text-brand-ink-soft">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ③–⑦ 카테고리 섹션 */}
      <div id="categories" className="scroll-mt-20 border-t border-brand-line bg-brand-page">
        {CATEGORIES.map(({ slug, label }, idx) => (
          <section
            key={slug}
            className={`px-6 py-12 ${idx !== 0 ? 'border-t border-brand-line' : ''}`}
          >
            <div className="mx-auto max-w-6xl">
              {/* 섹션 헤더 */}
              <div className="mb-6 text-center">
                <Link
                  href={`/category/${slug}`}
                  className="group inline-flex items-center"
                >
                  <h2 className="text-xl font-black text-brand-ink transition group-hover:text-brand-violet sm:text-2xl">
                    {label}
                  </h2>
                </Link>
              </div>

              {/* 캐러셀 */}
              <CategoryCarousel dreams={categoryDreams[idx]} />
            </div>
          </section>
        ))}
      </div>

      <SiteFooter />
    </div>
  )
}
