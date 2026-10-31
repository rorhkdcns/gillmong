import { GRADE_GUIDE_LIST } from '@/lib/dreamDisplay'

// 5등급 안내를 한 줄로 컴팩트하게 (설명은 마우스를 올리면 툴팁으로)
export default function GradeStrip() {
  return (
    <section aria-label="꿈 등급 안내" className="mx-auto max-w-6xl px-6 pb-2 pt-7">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 className="text-xl font-bold tracking-tight text-brand-ink">꿈은 5등급으로 감정돼요</h2>
        <span className="text-sm text-brand-ink-soft">A에 가까울수록 좋은 기운이 담긴 꿈이에요.</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {GRADE_GUIDE_LIST.map((g) => (
          <div key={g.grade} title={g.desc} className={`flex min-h-[52px] items-center gap-2.5 rounded-[4px] px-3.5 py-2.5 ${g.badgeBg}`}>
            <span className="font-display text-[1.75rem] font-extrabold leading-none">{g.grade}</span>
            <strong className="whitespace-nowrap text-[0.9rem]">{g.label}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
