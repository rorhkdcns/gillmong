import { GRADE_INFO, type Grade } from '@/lib/dreamDisplay'

interface Item { id: number; title: string; grade: string }

// "방금 감정된 꿈" 가로 흐름 띠. 이미 조회한 최신 꿈을 그대로 보여준다.
export default function RecentTicker({ items }: { items: Item[] }) {
  if (items.length === 0) return null
  const loop = [...items, ...items]
  return (
    <section aria-label="방금 감정된 꿈" className="overflow-hidden bg-brand-ink py-3.5 text-white">
      <div className="gm-marquee flex w-max gap-10">
        {loop.map((it, i) => (
          <span key={`${it.id}-${i}`} aria-hidden={i >= items.length} className="flex items-center gap-2.5 whitespace-nowrap text-sm">
            <span className={`font-display flex h-6 w-6 items-center justify-center rounded-[3px] text-sm font-extrabold ${GRADE_INFO[it.grade as Grade]?.badgeBg ?? 'bg-gray-400 text-white'}`}>{it.grade}</span>
            {it.title}
          </span>
        ))}
      </div>
    </section>
  )
}
