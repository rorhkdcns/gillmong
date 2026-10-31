'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sellSavedDream, saveMyDream } from '../dreamMoveActions'
import { GRADE_INFO, type Grade } from '@/lib/dreamDisplay'

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
  /** 'sell' = 저장함 → 마켓 판매, 'save' = 내 꿈 → 저장함 */
  action?: 'sell' | 'save'
  actionLabel?: string
}

export type CategoryOpt = { slug: string; name: string }

export default function DreamListSection({
  title,
  items,
  categories = [],
}: {
  title: string
  items: DreamListItem[]
  categories?: CategoryOpt[]
}) {
  const router = useRouter()
  const [sellTarget, setSellTarget] = useState<DreamListItem | null>(null)
  const [sellCat, setSellCat] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [keepCopy, setKeepCopy] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')

  async function doSell() {
    if (!sellTarget) return
    if (!sellCat) { setErr('카테고리를 선택해주세요.'); return }
    setBusy(true); setErr('')
    const r = await sellSavedDream(sellTarget.id, sellCat, Number(sellPrice), keepCopy)
    setBusy(false)
    if (r.error) { setErr(r.error); return }
    setSellTarget(null); setSellCat(''); setSellPrice('')
    setNotice('마켓에 판매 등록했어요.')
    router.refresh()
  }

  async function doSave(item: DreamListItem) {
    const msg = item.subText === '판매완료'
      ? `"${item.title}"을(를) 저장함에 복사할까요?\n(판매 기록은 그대로 남아요)`
      : `"${item.title}"을(를) 마켓에서 내리고 저장함으로 옮길까요?`
    if (!window.confirm(msg)) return
    setBusy(true)
    const r = await saveMyDream(item.id)
    setBusy(false)
    if (r.error) { setNotice(r.error); return }
    setNotice(r.moved ? '마켓에서 내리고 저장함으로 옮겼어요.' : '저장함에 복사했어요.')
    router.refresh()
  }
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
    <section id={`section-${title}`} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-8">
      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-extrabold text-[#231C17]">{title}</h2>
          <span className="text-base font-bold text-[#C23A18]">{items.length}건</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              type="button"
              onClick={clearFilter}
              className="flex items-center gap-1 rounded-[3px] bg-amber-50 px-2.5 py-1 text-xs text-[#C23A18] hover:bg-amber-100"
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
                  ? 'border-[#231C17] bg-[#231C17] text-white'
                  : 'border-gray-300 text-[#6B605A] hover:border-[#231C17] hover:text-[#231C17]'
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
                      className="rounded px-2 py-1 text-sm text-[#6B605A] hover:bg-gray-100"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-semibold text-[#231C17]">
                      {year}년 {month + 1}월
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalBase(new Date(year, month + 1, 1))}
                      className="rounded px-2 py-1 text-sm text-[#6B605A] hover:bg-gray-100"
                    >
                      ›
                    </button>
                  </div>
                  <div className="mb-1 grid grid-cols-7 text-center">
                    {WEEKDAYS.map((d, i) => (
                      <span
                        key={d}
                        className={`text-xs ${i === 0 ? 'text-red-400' : i === 6 ? 'text-brand-primary' : 'text-gray-400'}`}
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
                              ? 'bg-[#231C17] text-white'
                              : count > 0
                              ? 'bg-amber-50 hover:bg-amber-100'
                              : 'hover:bg-gray-50'
                          } ${!isSelected && dow === 0 ? 'text-red-400' : ''} ${!isSelected && dow === 6 ? 'text-brand-primary' : ''}`}
                        >
                          <span
                            className={
                              isToday && !isSelected
                                ? 'underline decoration-[#C23A18] underline-offset-2'
                                : ''
                            }
                          >
                            {day}
                          </span>
                          {count > 0 && (
                            <span
                              className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#C23A18]'}`}
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
                      className="mt-3 w-full rounded border border-gray-200 py-1.5 text-xs text-[#6B605A] hover:bg-gray-50"
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
        <p className="py-8 text-center text-sm text-[#6B605A]">
          {selectedDate ? `${selectedDate}에 내역이 없습니다` : '내역이 없습니다'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {pageItems.map((item, idx) => (
            <li key={`${item.id}-${idx}`} className="flex items-center gap-3 py-4">
              {/* 날짜 */}
              <span className="w-[88px] shrink-0 text-xs tabular-nums text-[#6B605A]">
                {item.date.slice(0, 10)}
              </span>
              {/* 등급 + 제목 */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-xs font-bold ${GRADE_INFO[item.grade as Grade]?.badgeBg ?? 'bg-gray-400'}`}
                >
                  {item.grade}
                </span>
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className="block truncate text-base font-medium text-[#3A322C] hover:text-[#231C17] hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.subText && (
                    <p className="text-xs text-[#6B605A]">{item.subText}</p>
                  )}
                </div>
              </div>
              {item.action && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => (item.action === 'sell' ? (setSellTarget(item), setErr('')) : doSave(item))}
                  className="shrink-0 rounded-[3px] border border-brand-ink px-2.5 py-1 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white disabled:opacity-50"
                >
                  {item.actionLabel ?? (item.action === 'sell' ? '판매하기' : '저장하기')}
                </button>
              )}
              {/* 포인트 */}
              {item.price != null && (
                <div className="shrink-0 text-right">
                  <p className="text-base font-bold text-[#C23A18]">
                    {item.price.toLocaleString()}원
                    {item.priceLabel && (
                      <span className="ml-0.5 text-xs font-normal text-[#6B605A]">{item.priceLabel}</span>
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
              className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#6B605A] hover:bg-gray-100"
            >
              ‹
            </button>
          )}
          {pageRange[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#6B605A] hover:bg-gray-100"
              >
                1
              </button>
              {pageRange[0] > 2 && (
                <span className="flex h-8 w-6 items-center justify-center text-sm text-[#B8ADA6]">…</span>
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
                  ? 'bg-[#231C17] font-semibold text-white'
                  : 'text-[#6B605A] hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
          {pageRange[pageRange.length - 1] < totalPages && (
            <>
              {pageRange[pageRange.length - 1] < totalPages - 1 && (
                <span className="flex h-8 w-6 items-center justify-center text-sm text-[#B8ADA6]">…</span>
              )}
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#6B605A] hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}
          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded text-sm text-[#6B605A] hover:bg-gray-100"
            >
              ›
            </button>
          )}
        </div>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-[3px] bg-brand-primary-light px-3 py-2 text-sm text-brand-primary-hover">{notice}</p>
      )}

      {sellTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4" onClick={() => !busy && setSellTarget(null)}>
          <div className="w-full max-w-sm rounded-[4px] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-bold text-brand-ink">마켓에 판매하기</h3>
            <p className="mb-4 truncate text-sm text-brand-ink-soft">{sellTarget.title}</p>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block font-semibold text-brand-ink">카테고리</span>
              <select value={sellCat} onChange={(e) => setSellCat(e.target.value)} className="w-full rounded-[3px] border border-brand-line bg-white px-3 py-2 outline-none focus:border-brand-primary">
                <option value="">선택해주세요</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block font-semibold text-brand-ink">판매금액 (5,000원 이상, 100원 단위)</span>
              <input type="number" inputMode="numeric" min={5000} step={100} value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="예) 10000" className="w-full rounded-[3px] border border-brand-line px-3 py-2 outline-none focus:border-brand-primary" />
            </label>
            <label className="mb-3 flex items-center gap-2 text-sm text-brand-ink">
              <input type="checkbox" checked={keepCopy} onChange={(e) => setKeepCopy(e.target.checked)} className="h-4 w-4 accent-[#E5421F]" />
              저장함에도 남겨두기
            </label>
            {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={doSell} className="flex-1 rounded-[3px] bg-brand-primary py-2.5 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60">{busy ? '등록 중...' : '판매 등록'}</button>
              <button type="button" disabled={busy} onClick={() => setSellTarget(null)} className="rounded-[3px] border border-brand-line px-4 py-2.5 text-sm font-semibold text-brand-ink-soft hover:border-brand-ink">취소</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
