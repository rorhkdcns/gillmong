import Link from 'next/link'

// 히어로: 한 줄 카피 + 두 개의 버튼 + 등급 카드 3장이 펼쳐지는 장식 (기능 없음)
const SAMPLE_CARDS = [
  { grade: 'C', name: '평범한 꿈', cls: 'bg-grade-c-bg text-grade-c-fg', tx: '-92px', rot: '-9deg', delay: '.55s' },
  { grade: 'B', name: '좋은 길몽', cls: 'bg-grade-b-bg text-grade-b-fg', tx: '92px', rot: '9deg', delay: '.7s' },
  { grade: 'A', name: '최고의 길몽', cls: 'bg-grade-a-bg text-grade-a-fg gm-holo', tx: '0px', rot: '0deg', delay: '.85s' },
]

export default function HomeHero() {
  return (
    <section className="overflow-hidden bg-brand-primary-light">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-6 py-12 md:py-20">
        <div className="flex min-w-[18rem] flex-[1_1_28rem] flex-col gap-5">
          <h1 className="text-[2.5rem] font-bold leading-[1.2] tracking-[-0.03em] text-brand-ink md:text-[3.75rem]">
            <span className="gm-rise block" style={{ animationDelay: '.1s' }}>어젯밤 꾼 꿈,</span>
            <span className="gm-rise block" style={{ animationDelay: '.25s' }}>몇 등급일까?</span>
          </h1>
          <p className="gm-rise max-w-[30em] text-base leading-[1.7] text-brand-ink-soft md:text-lg" style={{ animationDelay: '.4s' }}>
            꿈을 적으면 등급과 해몽, 행운 번호가 바로 나와요. 좋은 꿈은 원하는 가격에 팔고, 다른 사람의 꿈도 만나보세요.
          </p>
          <div className="gm-rise flex flex-wrap gap-2.5" style={{ animationDelay: '.55s' }}>
            <Link href="#appraisal" className="rounded-[3px] bg-brand-primary px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-primary-hover">
              꿈 감정하기
            </Link>
            <Link href="#market" className="rounded-[3px] border-2 border-brand-ink bg-white px-6 py-3 text-base font-bold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white">
              꿈 구경하기
            </Link>
          </div>
        </div>

        {/* 등급 카드 펼침 (장식) */}
        <div aria-hidden="true" className="relative mx-auto hidden h-[340px] w-[330px] flex-none sm:block">
          {SAMPLE_CARDS.map((c) => (
            <div
              key={c.grade}
              className={`gm-deal absolute left-1/2 top-4 -ml-[100px] flex h-[300px] w-[200px] flex-col justify-between overflow-hidden rounded-[4px] p-5 shadow-[0_14px_30px_rgba(35,28,23,0.16)] ${c.cls}`}
              style={{ ['--tx' as string]: c.tx, ['--rot' as string]: c.rot, animationDelay: c.delay }}
            >
              <span className="relative z-10 text-sm font-medium opacity-80">꿈 등급</span>
              <span className="font-display relative z-10 text-[110px] font-extrabold leading-[.8]">{c.grade}</span>
              <span className="relative z-10 text-lg font-bold">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
