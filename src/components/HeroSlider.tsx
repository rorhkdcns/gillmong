'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Slide {
  eyebrow?: string
  title: React.ReactNode
  desc: string
  ctaLabel: string
  ctaHref: string
  ctaStyle: 'dark' | 'light'
  bg: string
  /** 배경이 어두운 톤인지 — 제목/본문 글자색(흰색 vs 잉크색)과 도트 인디케이터 판별에 씀.
   *  배경 순서가 바뀌거나 슬라이드가 추가돼도 안전하도록 인덱스가 아니라 이 값으로 판단한다. */
  dark: boolean
}

const SLIDES: Slide[] = [
  {
    eyebrow: '세상에 없던 꿈 거래소',
    title: (
      <>꿈은 누구에게나<br /><span className="text-brand-primary">기회와 아이디어</span>가 될 수 있어요</>
    ),
    desc: '길몽상점은 꿈을 통해 나를 이해하고, 일상의 아이디어를 발견하는 공간입니다.',
    ctaLabel: '나의 꿈 감정하기',
    ctaHref: '#appraisal',
    ctaStyle: 'dark',
    bg: 'bg-[linear-gradient(160deg,#E6F1F8_0%,#F0F7FA_55%,#FDF4E4_100%)]',
    dark: false,
  },
  {
    title: (
      <>좋은 꿈은<br /><span className="text-brand-primary">사고팔 수</span> 있습니다</>
    ),
    desc: 'A등급 길몽부터 재미있는 꿈까지, 마켓에서 만나보세요.',
    ctaLabel: '꿈 구경하기',
    ctaHref: '#categories',
    ctaStyle: 'light',
    bg: 'bg-[linear-gradient(150deg,#092636_0%,#14547A_100%)]',
    dark: true,
  },
  {
    eyebrow: '실시간 업데이트되는 꿈 사전',
    title: (
      <>어젯밤 꾼 그 꿈,<br /><span className="text-brand-primary">무슨 뜻</span>일까요?</>
    ),
    desc: '돼지꿈, 이빨 빠지는 꿈부터 흔한 악몽까지 — 궁금한 꿈을 검색해서 바로 확인해보세요.',
    ctaLabel: '해몽사전 보러가기',
    ctaHref: '/dictionary',
    ctaStyle: 'light',
    bg: 'bg-[linear-gradient(150deg,#0B2433_0%,#2FB68E_120%)]',
    dark: true,
  },
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef(0)

  const goTo = useCallback((i: number) => {
    setCurrent((i + SLIDES.length) % SLIDES.length)
  }, [])

  const autoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5000)
  }, [])

  useEffect(() => {
    autoplay()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoplay])

  const isDark = SLIDES[current].dark

  return (
    <section className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX
          if (diff > 50) { goTo(current + 1); autoplay() }
          else if (diff < -50) { goTo(current - 1); autoplay() }
        }}
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className={`relative flex min-h-[150px] w-full shrink-0 items-center px-6 py-6 md:min-h-[380px] md:px-16 md:py-20 ${slide.bg}`}>
            <div className="relative z-10 mx-auto w-full max-w-3xl">
              {slide.eyebrow && (
                <span className="mb-2 inline-block rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-brand-violet-deep md:mb-4">
                  {slide.eyebrow}
                </span>
              )}
              <h1 className={`mb-2 text-3xl font-black leading-snug tracking-tight md:mb-4 md:text-5xl ${slide.dark ? 'text-white' : 'text-brand-ink'}`}>
                {slide.title}
              </h1>
              <p className={`mb-7 hidden max-w-lg text-base leading-relaxed md:block md:text-lg ${slide.dark ? 'text-white/85' : 'text-brand-ink-soft'}`}>
                {slide.desc}
              </p>
              <a
                href={slide.ctaHref}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-base font-bold shadow-lg transition-transform hover:-translate-y-0.5 md:px-8 md:py-3.5 ${
                  slide.ctaStyle === 'dark' ? 'bg-brand-ink text-white' : 'bg-white text-brand-ink'
                }`}
              >
                {slide.ctaLabel} <span>→</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 화살표 */}
      <button
        onClick={() => { goTo(current - 1); autoplay() }}
        aria-label="이전 배너"
        className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-brand-ink shadow-md transition hover:bg-white sm:flex"
      >
        ‹
      </button>
      <button
        onClick={() => { goTo(current + 1); autoplay() }}
        aria-label="다음 배너"
        className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-brand-ink shadow-md transition hover:bg-white sm:flex"
      >
        ›
      </button>

      {/* 도트 */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); autoplay() }}
            aria-label={`${i + 1}번째 배너`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-brand-ink' : `w-2 ${isDark ? 'bg-white/40' : 'bg-brand-ink/25'}`
            }`}
          />
        ))}
      </div>
    </section>
  )
}
