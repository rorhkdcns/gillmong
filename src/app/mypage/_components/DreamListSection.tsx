'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const PAGE_SIZE = 10

export type DreamListItem = {
  id: number
  date: string
  title: string
  grade: string
  price?: number
  priceLabel?: string
  href: string
  subText?: string
}

export default function DreamListSection({
  title,
  items,
}: {
  title: string
  items: DreamListItem[]
}) {
  const [page, setPage] = useState(1)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calBase, setCalBase] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })

  const filtered = useMemo(() => {
    if (!selectedDate) return items
    return items.filter(item => item.date.slice(0, 10) === selectedDate)
  }, [items, selectedDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const year = calBase.getFullYear()
  const month = calBase.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const byDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of items) {
      const d = item.date.slice(0, 10)
      map[d] = (map[d] ?? 0) + 1
    }
    return map
  }, [items])

  function handleDateClick(dateStr: string) {
    setSelectedDate(prev => (prev === dateStr ? null : dateStr))
    setPage(1)
    setCalendarOpen(false)
  }

  function clearFilter() {
    setSelectedDate(null)
    setPage(1)
  }

  function handlePageChange(p: number) {
    setPage(p)
    // 섹션 상단으로 부드럽게 스크롤
    if (typeof window !== 'undefined') {
      const el = document.getElementById(`section-${title}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 표시할 페이지 번호 범위 (최대 7개, 현재 페이지 중심)
  const pageRange = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const half = 3
    let start = Math.max(1, currentPage - half)
    const end = Math.min(totalPages, start + 6)
    start = Math.max(1, end - 6)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [totalPages, currentPage])

  return (
    <section id={`section-${title}`} className="border border-gray-200 bg-white p-5 md:p-8">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">{title}</h2>
          <span className="text-sm text-[#777777]">{items.length}건</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              type="button"
              onClick={clearFilter}
              className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-[#E07B2A] hover:bg-amber-100"
            >
              {selectedDate}
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCalendarOpen(v => !v)}
              className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                calendarOpen
                  ? 'border-[#01273A] bg-[#01273A] text-white'
                  : 'border-gray-300 text-[#555555] hover:border-[#01273A] hover:text-[#01273A]'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              달력
            </button>

            {calendarOpen && (
              <>
                {/* 배경 오버레이 */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCalendarOpen(false)}
                />
                {/* 달력 모달 */}
                <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCalBase(new Date(year, month - 1, 1))}
                      className="rounded px-2 py-1 text-sm text-[#555555] hover:bg-gray-100"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-semibold text-[#01273A]">
                      {year}년 {month + 1}월
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalBase(new Date(year, month + 1, 1))}
                      className="rounded px-2 py-1 text-sm text-[#555555] hover:bg-gray-100"
                    >
                      ›
                    </button>
                  </div>
                  <div className="mb-1 grid grid-cols-7 text-center">
                    {WEEKDAYS.map((d, i) => (
                      <span
                        key={d}
                        className={`text-xs ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                    {cells.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} />
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const count = byDate[dateStr] ?? 0
                      const isSelected = selectedDate === dateStr
                      const isToday = dateStr === todayStr
                      const dow = (firstWeekday + day - 1) % 7
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDateClick(dateStr)}
                          className={`flex flex-col items-center justify-center rounded py-1.5 text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#01273A] text-white'
                              : count > 0
                              ? 'bg-amber-50 hover:bg-amber-100'
                              : 'hover:bg-gray-50'
                          } ${!isSelected && dow === 0 ? 'text-red-400' : ''} ${!isSelected && dow === 6 ? 'text-blue-400' : ''}`}
                        >
                          <span
                            className={
                              isToday && !isSelected
                                ? 'underline decoration-[#E07B2A] underline-offset-2'
                                : ''
                            }
                          >
                            {day}
                          </span>
                          {count > 0 && (
                            <span
                              className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#E07B2A]'}`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => { setSelectedDate(null); setPage(1); setCalendarOpen(false) }}
                      className="mt-3 w-full rounded border border-gray-200 py-1.5 text-xs text-[#777777] hover:bg-gray-50"
                    >
                      필터 초기화
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#999]">
          {selectedDate ? `${selectedDate}에 내역이 없습니다` : '내역이 없습니다'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {pageItems.map((item, idx) => (
            <li key={`${item.id}-${idx}`} className="flex items-center gap-3 py-4">
              {/* 날짜 */}
              <span className="w-[88px] shrink-0 text-xs tabular-nums text-[#999]">
                {item.date.slice(0, 10)}
              </span>
              {/* 등급 + 제목 */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[item.grade] ?? 'bg-gray-400'}`}
                >
                  {item.grade}
                </span>
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className="block truncate text-sm text-[#333333] hover:text-[#01273A] hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.subText && (
                    <p className="text-xs text-[#999]">{item.subText}</p>
                  )}
                </div>
              </div>
              {/* 포인트 */}
              {item.price != null && (
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#E07B2A]">
                    {item.price.toLocaleString()} P
                    {item.priceLabel && (
                      <span className="ml-0.5 text-xs font-normal text-[#999]">{item.priceLabel}</span>
                    )}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#555555] hover:bg-gray-100"
            >
              ‹
            </button>
          )}
          {pageRange[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#555555] hover:bg-gray-100"
              >
                1
              </button>
              {pageRange[0] > 2 && (
                <span className="flex h-8 w-6 items-center justify-center text-sm text-[#bbb]">…</span>
              )}
            </>
          )}
          {pageRange.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handlePageChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${
                p === currentPage
                  ? 'bg-[#01273A] font-semibold text-white'
                  : 'text-[#555555] hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
          {pageRange[pageRange.length - 1] < totalPages && (
            <>
              {pageRange[pageRange.length - 1] < totalPages - 1 && (
                <span className="flex h-8 w-6 items-center justify-center text-sm text-[#bbb]">…</span>
              )}
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#555555] hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}
          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#555555] hover:bg-gray-100"
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  )
}
