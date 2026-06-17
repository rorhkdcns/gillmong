'use client'

import { useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
}

export interface DreamCard {
  id: number
  title: string
  body: string
  grade: string
  price: number
  is_sold: boolean
  nickname?: string
}

interface Props {
  title: string
  description: string
  activePath: string
  cards: DreamCard[]
}


export default function CategoryPage({ title, description, activePath, cards }: Props) {
  const [sort, setSort] = useState<'latest' | 'price' | 'grade'>('latest')
  const [visibleCount, setVisibleCount] = useState(6)

  const sorted = [...cards].sort((a, b) => {
    if (sort === 'price') return b.price - a.price
    if (sort === 'grade') return a.grade.localeCompare(b.grade)
    return b.id - a.id
  })

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      <SiteHeader activePath={activePath} />

      {/* ───── 히어로 ───── */}
      <section className="bg-white px-6 pb-6 pt-14 text-center">
        <h1 className="mb-3 text-4xl text-[#01273A]">{title}</h1>
        <p className="mb-6 text-base text-[#555555]">{description}</p>
        <div className="mx-auto max-w-6xl border-b" style={{ borderColor: '#E0E0E0' }} />
      </section>

      {/* ───── 필터/정렬 바 ───── */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-[#01273A]">{cards.length}개</span>의 꿈
          </p>
          <div className="flex gap-2">
            {(['latest', 'price', 'grade'] as const).map((key) => {
              const label = key === 'latest' ? '최신순' : key === 'price' ? '가격순' : '등급순'
              return (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    sort === key
                      ? 'bg-[#01273A] text-white'
                      : 'border border-gray-300 text-[#555555] hover:border-[#01273A] hover:text-[#01273A]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ───── 카드 그리드 ───── */}
      <section className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3">
            {visible.map((card) => (
              <article
                key={card.id}
                className={`flex flex-col rounded-xl border p-4 shadow-sm transition-shadow md:rounded-2xl md:p-6 ${
                  card.is_sold
                    ? 'border-gray-200 bg-gray-50 opacity-70'
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                {/* 등급 + 닉네임 */}
                <div className="mb-2 flex items-center gap-1.5 md:mb-3 md:gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white md:h-6 md:w-6 ${GRADE_COLOR[card.grade] ?? 'bg-gray-400'}`}>
                    {card.grade}
                  </span>
                  {card.is_sold ? (
                    <span className="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-bold text-white">판매완료</span>
                  ) : card.nickname ? (
                    <span className="truncate text-xs text-gray-400 md:text-sm">@{card.nickname}</span>
                  ) : null}
                </div>

                {/* 제목 */}
                <h3 className="mb-2 text-sm font-semibold leading-snug text-[#555555] line-clamp-2 md:mb-3 md:text-lg">{card.title}</h3>

                {/* 내용 요약 */}
                <p className="flex-1 text-xs leading-relaxed text-[#555555] line-clamp-2 md:text-sm md:line-clamp-3">{card.body}</p>

                {/* 감정가 + 버튼 */}
                <div className="mt-3 border-t border-gray-100 pt-3 md:mt-4 md:pt-4">
                  {/* 모바일: 세로 배치 */}
                  <div className="flex flex-col gap-2 md:hidden">
                    <div>
                      <span className="text-xs text-gray-400">감정가</span>
                      <p className={`text-sm font-bold ${card.is_sold ? 'text-gray-400' : 'text-[#E07B2A]'}`}>
                        {card.price.toLocaleString()} P
                      </p>
                    </div>
                    {card.is_sold ? (
                      <span className="w-full rounded-full border border-gray-300 py-2 text-center text-xs font-semibold text-gray-400 cursor-not-allowed">
                        판매완료
                      </span>
                    ) : (
                      <a href={`/dream/${card.id}`} className="w-full rounded-full bg-[#6B96A8] py-2 text-center text-xs font-semibold text-white transition-all hover:brightness-90">
                        자세히 보기
                      </a>
                    )}
                  </div>
                  {/* PC: 가로 배치 */}
                  <div className="hidden items-center justify-between md:flex">
                    <div>
                      <span className="text-xs text-gray-400">감정가</span>
                      <p className={`text-base font-bold ${card.is_sold ? 'text-gray-400' : 'text-[#E07B2A]'}`}>
                        {card.price.toLocaleString()} P
                      </p>
                    </div>
                    {card.is_sold ? (
                      <span className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed">
                        판매완료
                      </span>
                    ) : (
                      <a href={`/dream/${card.id}`} className="rounded-full bg-[#6B96A8] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-90">
                        자세히 보기
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* 더보기 버튼 */}
          <div className="mt-12 text-center">
            <button
              onClick={() => hasMore && setVisibleCount((v) => v + 6)}
              disabled={!hasMore}
              className={`rounded-full px-10 py-3 text-base font-semibold transition-all ${
                hasMore
                  ? 'bg-[#E07B2A] text-white hover:brightness-90'
                  : 'cursor-not-allowed border border-gray-300 text-gray-400'
              }`}
            >
              {hasMore ? '꿈 이야기 더 보기' : '마지막 꿈입니다'}
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
