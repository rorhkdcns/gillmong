import { createAdminClient } from '@/lib/supabase/admin'
import DreamInput from './_components/DreamInput'
import SiteFooter from '@/components/SiteFooter'
import BannerSlider from '@/components/BannerSlider'
import HeroSlider from '@/components/HeroSlider'
import CategoryCarousel from '@/components/CategoryCarousel'
import { getActiveCategories } from '@/lib/categories'
import Link from 'next/link'

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
        .select('id, title, summary, grade, price, user_id')
        .eq('category_id', id)
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

      {/* ③–⑦ 카테고리 섹션 */}
      <div id="categories" className="scroll-mt-20 border-t border-brand-line bg-brand-page">
        {categories.map(({ slug, name }, idx) => (
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
                    {name}
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
