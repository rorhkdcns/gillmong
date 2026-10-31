import Link from 'next/link'

export default function FortuneBanner() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-14 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-[4px] bg-brand-ink px-7 py-8 text-white md:px-10">
        <div className="flex flex-col gap-1.5">
          <strong className="text-xl md:text-2xl">오늘의 운세도 확인해보세요</strong>
          <span className="text-sm text-white/70">띠별 운세와 행운의 숫자를 매일 알려드려요.</span>
        </div>
        <Link href="/fortune" className="rounded-[3px] bg-brand-gold px-6 py-3.5 text-base font-bold text-brand-ink transition-opacity hover:opacity-90">
          오늘의 운세 보기
        </Link>
      </div>
    </section>
  )
}
