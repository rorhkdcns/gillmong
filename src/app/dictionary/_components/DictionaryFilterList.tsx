'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CHOSEONG_GROUPS, getChoseongGroup } from '@/lib/hangul'

export interface DictionaryFilterEntry {
  slug: string
  keyword: string
  summary: string
  tags: string[] | null
}

interface Props {
  entries: DictionaryFilterEntry[]
}

const ALL_CHO = 'all'

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#8CA0AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function DictionaryFilterList({ entries }: Props) {
  const [query, setQuery] = useState('')
  const [cho, setCho] = useState<string>(ALL_CHO)

  // 초성 필터를 제외한 나머지(검색) 조건까지만 적용한 목록.
  // 초성 버튼의 활성/비활성 판정에 쓰기 위함 (다른 필터가 좁혀지면 초성 버튼도 그에 맞게 갱신됨).
  const bySearch = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (q && !(e.keyword.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q))) return false
      return true
    })
  }, [entries, query])

  const availableCho = useMemo(
    () => new Set(bySearch.map((e) => getChoseongGroup(e.keyword))),
    [bySearch],
  )

  const filtered = useMemo(() => {
    if (cho === ALL_CHO) return bySearch
    return bySearch.filter((e) => getChoseongGroup(e.keyword) === cho)
  }, [bySearch, cho])

  const hasActiveFilter = query.trim() !== '' || cho !== ALL_CHO

  function resetFilters() {
    setQuery('')
    setCho(ALL_CHO)
  }

  return (
    <div className="rounded-[14px] bg-white p-[20px_18px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] md:p-[26px_24px]">

      {/* 검색 */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="궁금한 꿈을 검색해보세요 (예: 돼지꿈, 뱀꿈)"
        className="w-full rounded-[10px] border border-[#DCE5EB] bg-white px-4 py-2.5 text-sm text-[#16303F] outline-none focus:border-[#2E7DD1]"
      />

      {/* 초성 필터 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCho(ALL_CHO)}
          className={`rounded-[8px] px-3 py-1.5 text-sm font-semibold transition-colors ${
            cho === ALL_CHO
              ? 'bg-[#0B2433] text-white'
              : 'border border-[#DCE5EB] text-[#5C6E7C] hover:border-[#2E7DD1] hover:text-[#2E7DD1]'
          }`}
        >
          전체
        </button>
        {CHOSEONG_GROUPS.map((c) => {
          const disabled = !availableCho.has(c)
          const active = cho === c
          return (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => setCho(c)}
              className={`rounded-[8px] px-3 py-1.5 text-sm font-semibold transition-colors ${
                disabled
                  ? 'cursor-not-allowed text-gray-300'
                  : active
                    ? 'bg-[#0B2433] text-white'
                    : 'border border-[#DCE5EB] text-[#5C6E7C] hover:border-[#2E7DD1] hover:text-[#2E7DD1]'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* 목록 */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-[#5C6E7C]">
              {entries.length === 0 ? '아직 등록된 사전 항목이 없습니다.' : '조건에 맞는 해몽이 없습니다'}
            </p>
            {entries.length > 0 && hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#DCE5EB] px-4 py-1.5 text-xs font-semibold text-[#5C6E7C] hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((e, i) => (
              <Link
                key={e.slug}
                href={`/dictionary/${e.slug}`}
                className={`flex min-h-[52px] items-center justify-between gap-3 bg-white px-1 py-3 transition-colors hover:bg-[#F7FAFC] ${
                  i > 0 ? 'border-t border-[#E2E9EE]' : ''
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[17px] text-[#16303F]">{e.keyword}</span>
                </span>
                <ChevronRightIcon />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
