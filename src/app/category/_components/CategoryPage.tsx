'use client'

import { useState } from 'react'
import SiteHeader from '@/components/SiteHeader'

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
      <section className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {visible.map((card) => (
              <article
                key={card.id}
                className={`flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow ${
                  card.is_sold
                    ? 'border-gray-200 bg-gray-50 opacity-70'
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                {/* 등급 뱃지 + 판매완료 뱃지 */}
                <div className="mb-3 flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[card.grade] ?? 'bg-gray-400'}`}>
                    {card.grade}
                  </span>
                  {card.is_sold && (
                    <span className="rounded-full bg-gray-400 px-2.5 py-0.5 text-xs font-bold text-white">
                      판매완료
                    </span>
                  )}
                </div>

                {/* 제목 */}
                <h3 className="mb-3 text-lg font-semibold text-[#555555] leading-snug">{card.title}</h3>

                {/* 내용 요약 */}
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[#555555] line-clamp-3">{card.body}</p>

                {/* 감정가 + 버튼 */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
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
                    <a
                      href={`/dream/${card.id}`}
                      className="rounded-full bg-[#6B96A8] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-90"
                    >
                      자세히 보기
                    </a>
                  )}
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

      {/* ───── 푸터 ───── */}
      <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-1 text-[#555555]">
            <span>대표: 홍길몽</span>
            <span>사업자등록번호: 000-00-00000</span>
            <span>통신판매업신고: 제2024-서울-00000호</span>
            <span>주소: 서울특별시 강남구 테헤란로 123</span>
            <span className="mt-2">고객센터: 1588-0000 · 평일 10:00 – 18:00 (점심 12:00–13:00, 주말·공휴일 휴무)</span>
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <div className="flex flex-wrap gap-5 text-[#555555]">
              {[
                { label: '이용약관',        href: '/terms' },
                { label: '개인정보처리방침', href: '/privacy' },
                { label: '이용안내',        href: '/guide' },
                { label: '제휴문의',        href: '#' },
              ].map(({ label, href }) => (
                <a key={label} href={href} className="hover:underline">{label}</a>
              ))}
            </div>
            <p className="text-gray-400">© 2024 길몽상점. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
