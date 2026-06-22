import { createAdminClient } from '@/lib/supabase/admin'
import DreamInput from './_components/DreamInput'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import BannerSlider from '@/components/BannerSlider'
import CategoryCarousel from '@/components/CategoryCarousel'
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
    ? await supabase.from('profiles').select('id, nickname, username').in('id', userIds)
    : { data: [] }

  const profileMap: Record<string, { nickname: string; username: string }> = {}
  for (const p of profiles ?? []) profileMap[p.id] = { nickname: p.nickname, username: p.username }

  const categoryDreams = categoryResults.map((r) =>
    (r.data ?? []).map((d) => ({
      ...d,
      nickname: profileMap[d.user_id]?.nickname ?? null,
      username: profileMap[d.user_id]?.username ?? null,
    }))
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      {/* ① 배너 */}
      <BannerSlider banners={activeBanners ?? []} />

      {/* ① 히어로 */}
      <section
        className="relative px-6 py-14 text-center"
        style={{
          backgroundColor: '#01273A',
          backgroundImage: "url('/hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="mb-6 inline-block rounded-full bg-white/20 px-5 py-2 text-base font-semibold text-white ring-1 ring-white/40">
            우리의 모든 꿈은 가치가 있습니다
          </span>
          <h1 className="mb-6 text-3xl font-black leading-tight tracking-wide text-white md:text-5xl">
            꿈은 누구에게나<br />
            기회와 아이디어가<br />
            될 수 있어요
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-white/80">
            길몽상점은 꿈을 통해 나를 이해하고,<br />
            일상의 아이디어를 발견하는 공간입니다.<br />
            당신의 꿈 이야기를 들려주세요.
          </p>
        </div>
      </section>

      {/* ② 꿈 감정소 */}
      <section className="px-6 pb-20 pt-16">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black text-[#01273A]">꿈 감정소</h2>
              <p className="mt-2 text-base font-medium text-[#555555]">Dream Appraisal Center</p>
            </div>
            <DreamInput />
          </div>
        </div>
      </section>

      {/* ③–⑦ 카테고리 섹션 */}
      <div className="border-t border-gray-200 bg-[#F2F2F2]">
        {CATEGORIES.map(({ slug, label }, idx) => (
          <section
            key={slug}
            className={`px-6 py-12 ${idx !== 0 ? 'border-t border-gray-200' : ''}`}
          >
            <div className="mx-auto max-w-6xl">
              {/* 섹션 헤더 */}
              <div className="mb-6 text-center">
                <Link
                  href={`/category/${slug}`}
                  className="group inline-flex items-center gap-1.5"
                >
                  <h2 className="text-xl font-black text-[#01273A] transition group-hover:text-[#E07B2A] sm:text-2xl">
                    {label}
                  </h2>
                  <svg
                    className="h-5 w-5 text-[#01273A] transition group-hover:text-[#E07B2A]"
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
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
