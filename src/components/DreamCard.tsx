import { GRADE_INFO, type Grade } from '@/lib/dreamDisplay'

export interface DreamCardProps {
  id: number
  title: string
  body?: string | null
  grade: string
  price: number
  is_sold?: boolean
  nickname?: string | null
}

export default function DreamCard({ id, title, body, grade, price, is_sold = false, nickname }: DreamCardProps) {
  return (
    <article
      className={`flex flex-col rounded-xl border p-4 shadow-sm transition-shadow md:rounded-2xl md:p-6 ${
        is_sold
          ? 'border-brand-line bg-gray-50 opacity-70'
          : 'border-brand-line bg-white hover:shadow-[0_20px_34px_rgba(11,36,51,0.12)]'
      }`}
    >
      {/* 등급 + 닉네임 */}
      <div className="mb-2 flex items-center gap-1.5 md:mb-3 md:gap-2">
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white md:h-6 md:w-6 ${GRADE_INFO[grade as Grade]?.badgeBg ?? 'bg-gray-400'}`}>
          {grade}
        </span>
        {is_sold ? (
          <span className="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-bold text-white">판매완료</span>
        ) : nickname ? (
          <span className="truncate text-xs text-brand-ink-soft md:text-sm">@{nickname}</span>
        ) : null}
      </div>

      {/* 제목 */}
      <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-brand-ink md:mb-3 md:text-lg">
        {title}
      </h3>

      {/* 내용 요약 */}
      <p className="flex-1 line-clamp-2 text-xs leading-relaxed text-brand-ink-soft md:text-sm md:line-clamp-3">
        {body ?? ''}
      </p>

      {/* 감정가 + 버튼 */}
      <div className="mt-3 border-t border-brand-line pt-3 md:mt-4 md:pt-4">
        {/* 모바일: 세로 배치 */}
        <div className="flex flex-col items-center gap-2 md:hidden">
          <div className="text-center">
            <span className="text-xs text-brand-ink-soft">감정가</span>
            <p className={`text-sm font-bold ${is_sold ? 'text-gray-400' : 'text-brand-ink'}`}>
              {price.toLocaleString()}원
            </p>
          </div>
          {is_sold ? (
            <span className="w-full cursor-not-allowed rounded-full border border-gray-300 py-2 text-center text-xs font-semibold text-gray-400">
              판매완료
            </span>
          ) : (
            <a
              href={`/dream/${id}`}
              className="w-full rounded-full bg-brand-primary-light py-2 text-center text-xs font-semibold text-brand-primary-hover transition-colors hover:bg-brand-primary hover:text-white"
            >
              자세히 보기
            </a>
          )}
        </div>
        {/* PC: 가로 배치 */}
        <div className="hidden items-center justify-between md:flex">
          <div>
            <span className="text-xs text-brand-ink-soft">감정가</span>
            <p className={`text-base font-bold ${is_sold ? 'text-gray-400' : 'text-brand-ink'}`}>
              {price.toLocaleString()}원
            </p>
          </div>
          {is_sold ? (
            <span className="cursor-not-allowed rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-400">
              판매완료
            </span>
          ) : (
            <a
              href={`/dream/${id}`}
              className="rounded-full bg-brand-primary-light px-5 py-2 text-sm font-semibold text-brand-primary-hover transition-colors hover:bg-brand-primary hover:text-white"
            >
              자세히 보기
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
