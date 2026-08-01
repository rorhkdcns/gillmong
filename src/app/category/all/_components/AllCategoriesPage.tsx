'use client'

import { useMemo, useState } from 'react'
import SiteFooter from '@/components/SiteFooter'
import DreamCard from '@/components/DreamCard'

interface Card {
  id: number
  title: string
  body: string
  grade: string
  price: number
  is_sold: boolean
  nickname?: string
  categorySlug: string
}

interface CategoryOption {
  slug: string
  name: string
}

interface Props {
  cards: Card[]
  categories: CategoryOption[]
}

const ALL_FILTER = '__all__'

export default function AllCategoriesPage({ cards, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState(ALL_FILTER)
  const [sort, setSort] = useState<'latest' | 'price' | 'grade'>('latest')
  const [visibleCount, setVisibleCount] = useState(6)

  const filtered = useMemo(
    () => (activeCategory === ALL_FILTER ? cards : cards.filter((c) => c.categorySlug === activeCategory)),
    [cards, activeCategory],
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price') return b.price - a.price
    if (sort === 'grade') return a.grade.localeCompare(b.grade)
    return b.id - a.id
  })

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  function handleCategoryClick(slug: string) {
    setActiveCategory(slug)
    setVisibleCount(6)
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">

      {/* ───── 히어로 ───── */}
      <section className="bg-white px-6 pb-6 pt-14 text-center">
        <h1 className="mb-3 text-4xl text-brand-ink">전체 꿈 보기</h1>
        <p className="mb-6 text-base text-brand-ink-soft">모든 카테고리의 꿈을 한눈에 살펴보세요</p>

        {/* 카테고리 필터 칩 */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleCategoryClick(ALL_FILTER)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeCategory === ALL_FILTER
                ? 'bg-brand-ink text-white'
                : 'border border-brand-line text-brand-ink-soft hover:border-brand-violet hover:text-brand-violet-deep'
            }`}
          >
            전체
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => handleCategoryClick(c.slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === c.slug
                  ? 'bg-brand-ink text-white'
                  : 'border border-brand-line text-brand-ink-soft hover:border-brand-violet hover:text-brand-violet-deep'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-6xl border-b border-brand-line" />
      </section>

      {/* ───── 필터/정렬 바 ───── */}
      <div className="border-b border-brand-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm text-brand-ink-soft">
            총 <span className="font-semibold text-brand-ink">{filtered.length}개</span>의 꿈
          </p>
          <div className="flex gap-2">
            {(['latest', 'price', 'grade'] as const).map((key) => {
              const label = key === 'latest' ? '최신순' : key === 'price' ? '가격순' : '등급순'
              return (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    sort === key
                      ? 'bg-brand-ink text-white'
                      : 'border border-brand-line text-brand-ink-soft hover:border-brand-violet hover:text-brand-violet-deep'
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
          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">등록된 꿈이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3">
              {visible.map((card) => (
                <DreamCard key={card.id} {...card} />
              ))}
            </div>
          )}

          {/* 더보기 버튼 */}
          {visible.length > 0 && (
            <div className="mt-12 text-center">
              <button
                onClick={() => hasMore && setVisibleCount((v) => v + 6)}
                disabled={!hasMore}
                className={`rounded-full px-10 py-3 text-base font-semibold transition-all ${
                  hasMore
                    ? 'bg-gradient-to-r from-brand-violet to-brand-pink text-white hover:brightness-95'
                    : 'cursor-not-allowed border border-gray-300 text-gray-400'
                }`}
              >
                {hasMore ? '꿈 이야기 더 보기' : '마지막 꿈입니다'}
              </button>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
