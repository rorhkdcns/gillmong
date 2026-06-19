'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/client'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
  F: 'bg-gray-400',
}

interface SearchCard {
  id: number
  title: string
  summary: string
  grade: string
  price: number
  is_sold: boolean
}

function SearchResults() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.trim() ?? ''

  const [results, setResults] = useState<SearchCard[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('dreams')
      .select('id, title, summary, grade, price, is_sold')
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .then((result: { data: SearchCard[] | null }) => {
        setResults(result.data ?? [])
        setLoading(false)
      })
  }, [q])

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-[#777777]">검색 중...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-6xl">

        {/* 검색어 헤더 */}
        <div className="mb-10 border-b border-gray-200 pb-6">
          {q ? (
            <>
              <p className="mb-1 text-sm text-[#777777]">검색어</p>
              <h1 className="text-3xl text-[#01273A]">
                <span className="text-[#E07B2A]">&ldquo;{q}&rdquo;</span> 검색 결과
              </h1>
              <p className="mt-2 text-sm text-[#777777]">
                {results.length > 0 ? `총 ${results.length}건의 꿈이 검색되었습니다` : '검색 결과가 없습니다'}
              </p>
            </>
          ) : (
            <h1 className="text-2xl text-[#01273A]">검색어를 입력해주세요</h1>
          )}
        </div>

        {/* 결과 없음 */}
        {q && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-5 h-14 w-14 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <p className="text-lg text-[#555555]">
              <span className="font-semibold text-[#01273A]">&ldquo;{q}&rdquo;</span>에 대한 검색 결과가 없습니다
            </p>
            <p className="mt-2 text-sm text-[#777777]">다른 검색어로 시도해보세요</p>
          </div>
        )}

        {/* 카드 그리드 */}
        {results.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {results.map((card) => (
              <article
                key={card.id}
                className={`flex flex-col border p-6 shadow-sm transition-shadow ${
                  card.is_sold
                    ? 'border-gray-200 bg-gray-50 opacity-70'
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                {/* 등급 + 판매완료 뱃지 */}
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
                <h3 className="mb-3 text-lg font-semibold leading-snug text-[#555555]">{card.title}</h3>

                {/* 요약 */}
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[#555555] line-clamp-3">{card.summary}</p>

                {/* 감정가 + 버튼 */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <span className="text-xs text-gray-400">감정가</span>
                    <p className={`text-base font-bold ${card.is_sold ? 'text-gray-400' : 'text-[#E07B2A]'}`}>
                      {card.price.toLocaleString()} P
                    </p>
                  </div>
                  {card.is_sold ? (
                    <span className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-400">
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
        )}

      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      <Suspense fallback={
        <main className="flex flex-1 items-center justify-center">
          <p className="text-[#777777]">검색 중...</p>
        </main>
      }>
        <SearchResults />
      </Suspense>

      <SiteFooter />
    </div>
  )
}
