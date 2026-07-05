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
}

const SLIDES: Slide[] = [
  {
    eyebrow: '세상에 없던 꿈 거래소',
    title: (
      <>꿈은 누구에게나<br /><span className="bg-gradient-to-r from-brand-violet to-brand-pink bg-clip-text text-transparent">기회와 아이디어</span>가 될 수 있어요</>
    ),
    desc: '길몽상점은 꿈을 통해 나를 이해하고, 일상의 아이디어를 발견하는 공간입니다.',
    ctaLabel: '나의 꿈 감정하기',
    ctaHref: '#appraisal',
    ctaStyle: 'dark',
    bg: 'bg-[linear-gradient(160deg,#E6F1F8_0%,#F0F7FA_55%,#FDF4E4_100%)]',
  },
  {
    title: (
      <>좋은 꿈은<br /><span className="bg-gradient-to-r from-[#7FD4F0] to-[#F2CE7E] bg-clip-text text-transparent">사고팔 수</span> 있습니다</>
    ),
    desc: 'A등급 길몽부터 재미있는 꿈까지, 마켓에서 만나보세요.',
    ctaLabel: '꿈 구경하기',
    ctaHref: '#categories',
    ctaStyle: 'light',
    bg: 'bg-[linear-gradient(150deg,#092636_0%,#14547A_100%)]',
  },
  {
    title: (
      <>내 꿈이 <span className="text-brand-gold">누군가에겐</span><br />간절한 행운</>
    ),
    desc: '감정받은 꿈을 판매 등록하면 판매금액의 80%를 정산해드려요.',
    ctaLabel: '판매 시작하기',
    ctaHref: '#appraisal',
    ctaStyle: 'light',
    bg: 'bg-[linear-gradient(150deg,#14547A_0%,#2E7DD1_120%)]',
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

  const isDark = SLIDES[current].bg.includes('092636') || SLIDES[current].bg.includes('14547A')

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
          <div key={i} className={`relative flex min-h-[300px] w-full shrink-0 items-center px-6 py-14 md:min-h-[380px] md:px-16 md:py-20 ${slide.bg}`}>
            <div className="relative z-10 mx-auto w-full max-w-3xl">
              {slide.eyebrow && (
                <span className="mb-4 inline-block rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-brand-violet-deep">
                  {slide.eyebrow}
                </span>
              )}
              <h1 className={`mb-4 text-3xl font-black leading-snug tracking-tight md:text-5xl ${i === 0 ? 'text-brand-ink' : 'text-white'}`}>
                {slide.title}
              </h1>
              <p className={`mb-7 max-w-lg text-base leading-relaxed md:text-lg ${i === 0 ? 'text-brand-ink-soft' : 'text-white/85'}`}>
                {slide.desc}
              </p>
              <a
                href={slide.ctaHref}
                className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-lg transition-transform hover:-translate-y-0.5 ${
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
