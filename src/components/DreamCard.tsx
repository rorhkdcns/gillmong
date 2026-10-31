import Link from 'next/link'
import { GRADE_INFO, GRADE_ORDER, type Grade } from '@/lib/dreamDisplay'

export interface DreamCardProps {
  id: number
  title: string
  body?: string | null
  grade: string
  price: number
  is_sold?: boolean
  nickname?: string | null
}

// 등급 알파벳이 큰 썸네일 + 제목/요약/가격. 카테고리 글자는 넣지 않는다.
export default function DreamCard({ id, title, body, grade, price, is_sold = false, nickname }: DreamCardProps) {
  const info = GRADE_INFO[grade as Grade]
  const level = Math.max(0, GRADE_ORDER.indexOf(grade as (typeof GRADE_ORDER)[number]))
  const filled = 5 - level // A=5칸 … E=1칸
  const thumbCls = is_sold ? 'bg-gray-200 text-gray-500' : info?.badgeBg ?? 'bg-gray-300 text-gray-600'

  const inner = (
    <>
      <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden ${thumbCls} ${grade === 'A' && !is_sold ? 'gm-holo' : ''}`}>
        <span className="font-display relative z-10 text-[4.5rem] font-extrabold leading-none md:text-[5.5rem]">{grade}</span>
        <span className="absolute bottom-2.5 left-3 z-10 flex gap-[3px]" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={`block h-[5px] w-[14px] rounded-[1px] bg-current ${i < filled ? 'opacity-90' : 'opacity-20'}`} />
          ))}
        </span>
        {is_sold && (
          <span className="absolute right-2 top-2 z-10 rounded-[2px] bg-gray-600 px-2 py-0.5 text-xs font-bold text-white">판매완료</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 md:p-4">
        <h3 className="line-clamp-2 text-[0.95rem] font-bold leading-snug text-brand-ink md:text-base">{title}</h3>
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-brand-ink-soft md:text-sm">{body ?? ''}</p>
        <div className="mt-2 flex items-end justify-between gap-2 border-t border-brand-line pt-2.5">
          <span className="min-w-0 truncate text-xs text-brand-ink-soft">{nickname ? `@${nickname}` : ''}</span>
          <strong className={`shrink-0 text-base ${is_sold ? 'text-gray-400' : 'text-brand-primary'}`}>{price.toLocaleString()}원</strong>
        </div>
      </div>
    </>
  )

  const base = 'flex h-full flex-col overflow-hidden rounded-[4px] border border-brand-line bg-white'
  if (is_sold) return <article className={`${base} opacity-70`}>{inner}</article>
  return (
    <article className="h-full">
      <Link href={`/dream/${id}`} className={`${base} gm-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary`}>
        {inner}
      </Link>
    </article>
  )
}
