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

export type CalendarItem = {
  id: number
  title: string
  grade: string
  price?: number
  date: string
  href: string
}

export default function DreamCalendar({ items }: { items: CalendarItem[] }) {
  const today = new Date()
  const [base, setBase] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string | null>(null)

  const byDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    for (const item of items) {
      const d = item.date.slice(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(item)
    }
    return map
  }, [items])

  const year = base.getFullYear()
  const month = base.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      {/* 월 이동 */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setBase(new Date(year, month - 1, 1)); setSelected(null) }}
          className="rounded px-3 py-1.5 text-sm text-[#555555] hover:bg-gray-100"
        >
          ‹ 이전
        </button>
        <span className="text-sm font-semibold text-[#01273A]">{year}년 {month + 1}월</span>
        <button
          type="button"
          onClick={() => { setBase(new Date(year, month + 1, 1)); setSelected(null) }}
          className="rounded px-3 py-1.5 text-sm text-[#555555] hover:bg-gray-100"
        >
          다음 ›
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={d} className={`text-xs ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </span>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const count = byDate[dateStr]?.length ?? 0
          const isSelected = selected === dateStr
          const isToday = dateStr === todayStr
          const dow = (firstWeekday + day - 1) % 7

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelected(isSelected ? null : dateStr)}
              className={`flex flex-col items-center justify-center rounded-lg py-2 transition-colors ${
                isSelected
                  ? 'bg-[#01273A] text-white'
                  : count > 0
                  ? 'bg-amber-50 hover:bg-amber-100'
                  : 'hover:bg-gray-50'
              } ${!isSelected && dow === 0 ? 'text-red-400' : ''} ${!isSelected && dow === 6 ? 'text-blue-400' : ''}`}
            >
              <span className={`text-xs font-medium leading-none ${isToday && !isSelected ? 'underline decoration-[#E07B2A] underline-offset-2' : ''}`}>
                {day}
              </span>
              {count > 0 && (
                <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#E07B2A]'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* 선택 날짜 상세 */}
      {selected && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-medium text-[#777777]">{selected}</p>
          {(byDate[selected] ?? []).length === 0 ? (
            <p className="py-2 text-center text-sm text-[#999]">이 날 꿈이 없어요</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {(byDate[selected] ?? []).map(item => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[item.grade] ?? 'bg-gray-400'}`}>
                      {item.grade}
                    </span>
                    <Link href={item.href} className="truncate text-sm text-[#333333] hover:underline">
                      {item.title}
                    </Link>
                  </div>
                  {item.price != null && (
                    <span className="ml-2 shrink-0 text-sm font-semibold text-[#E07B2A]">
                      {item.price.toLocaleString()} P
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
