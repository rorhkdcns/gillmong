'use client'

import { useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import DreamCard from '@/components/DreamCard'

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

      <SiteHeader />

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
              <DreamCard key={card.id} {...card} />
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
