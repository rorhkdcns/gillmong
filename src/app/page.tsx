import { createAdminClient } from '@/lib/supabase/admin'
import DreamInput from './_components/DreamInput'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import BannerSlider from '@/components/BannerSlider'

export const dynamic = 'force-dynamic'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
  F: 'bg-gray-400',
}

const GRADE_LABEL: Record<string, string> = {
  A: '최고의 길몽',
  B: '좋은 길몽',
  C: '평범한 꿈',
  D: '주의가 필요한 꿈',
  E: '흉몽의 기운',
  F: '해석 불가',
}

export default async function Home() {
  const supabase = createAdminClient()

  const [{ data: recentDreams }, { data: activeBanners }] = await Promise.all([
    supabase
      .from('dreams')
      .select('id, title, summary, grade, price')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('banners')
      .select('id, image_url, link_url')
      .eq('is_active', true)
      .order('order', { ascending: true }),
  ])

  const dreams  = recentDreams  ?? []
  const banners = activeBanners ?? []

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">

      <SiteHeader />

      <BannerSlider banners={banners} />

      {/* ───── 히어로 섹션 ───── */}
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

      {/* ───── 꿈 감정소 ───── */}
      <section className="px-6 pt-16 pb-20">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <span className="text-3xl text-[#F5A66D]">★</span>
              <h2 className="mt-2 text-2xl font-black text-gray-700">꿈 감정소</h2>
              <p className="mt-1 text-sm text-gray-400">Dream Appraisal Center</p>
            </div>
            <DreamInput />
          </div>
        </div>
      </section>

      {/* ───── EVERYONE'S DREAMS ───── */}
      <section className="border-t border-brand-border bg-[#F2F2F2] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-400">Community</p>
            <h2 className="text-3xl font-black text-[#E07B2A]">EVERYONE'S DREAMS</h2>
            <p className="mt-3 text-base text-brand-muted">모든 사람의 꿈에는 의미가 있습니다</p>
          </div>

          {dreams.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-[#777777]">아직 등록된 꿈이 없습니다</p>
              <p className="mt-2 text-sm text-[#999]">첫 번째 꿈을 감정하고 마켓에 등록해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3">
              {dreams.map((dream) => (
                <article
                  key={dream.id}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:rounded-2xl md:p-6"
                >
                  {/* 등급 + 라벨 */}
                  <div className="mb-2 flex items-center gap-1.5 md:mb-3 md:gap-2">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white md:h-6 md:w-6 ${GRADE_COLOR[dream.grade] ?? 'bg-gray-400'}`}>
                      {dream.grade}
                    </span>
                    <span className="truncate text-xs text-gray-400 md:text-sm">{GRADE_LABEL[dream.grade] ?? ''}</span>
                  </div>

                  {/* 제목 */}
                  <h3 className="mb-2 text-sm font-semibold leading-snug text-[#555555] line-clamp-2 md:mb-3 md:text-lg">{dream.title}</h3>

                  {/* 요약 */}
                  <p className="flex-1 text-xs leading-relaxed text-[#555555] line-clamp-2 md:text-sm md:line-clamp-3">{dream.summary}</p>

                  {/* 감정가 + 버튼 */}
                  <div className="mt-3 border-t border-gray-100 pt-3 md:mt-4 md:pt-4">
                    {/* 모바일: 세로 배치 */}
                    <div className="flex flex-col items-center gap-2 md:hidden">
                      <div className="text-center">
                        <span className="text-xs text-gray-400">감정가</span>
                        <p className="text-sm font-bold text-[#E07B2A]">{dream.price.toLocaleString()} P</p>
                      </div>
                      <a href={`/dream/${dream.id}`} className="w-full rounded-full bg-[#6B96A8] py-2 text-center text-xs font-semibold text-white transition-all hover:brightness-90">
                        자세히 보기
                      </a>
                    </div>
                    {/* PC: 가로 배치 */}
                    <div className="hidden items-center justify-between md:flex">
                      <div>
                        <span className="text-xs text-gray-400">감정가</span>
                        <p className="text-base font-bold text-[#E07B2A]">{dream.price.toLocaleString()} P</p>
                      </div>
                      <a href={`/dream/${dream.id}`} className="rounded-full bg-[#6B96A8] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-90">
                        자세히 보기
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <a
              href="/category/people"
              className="inline-block rounded-full bg-[#E07B2A] px-10 py-3 text-base font-bold text-white transition-colors hover:brightness-90"
            >
              꿈 이야기 더 보기
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
