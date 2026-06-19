'use client'

import { useState } from 'react'
import DreamCalendar, { type CalendarItem } from './DreamCalendar'

export default function ToggleDreamSection({
  title,
  count,
  calendarItems,
  children,
}: {
  title: string
  count: number
  calendarItems: CalendarItem[]
  children?: React.ReactNode
}) {
  const [view, setView] = useState<'list' | 'calendar'>('list')

  return (
    <section className="border border-gray-200 bg-white p-5 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg text-[#01273A]">{title}</h2>
          <span className="text-sm text-[#777777]">{count}건</span>
        </div>
        <button
          type="button"
          onClick={() => setView(v => v === 'list' ? 'calendar' : 'list')}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            view === 'calendar'
              ? 'border-[#01273A] bg-[#01273A] text-white'
              : 'border-gray-300 text-[#555555] hover:border-[#01273A] hover:text-[#01273A]'
          }`}
        >
          {view === 'list' ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              달력
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              목록
            </>
          )}
        </button>
      </div>

      {view === 'list' ? (
        count === 0 ? (
          <p className="py-6 text-center text-sm text-[#999]">내역이 없습니다</p>
        ) : (
          <ul className="divide-y divide-gray-100">{children}</ul>
        )
      ) : (
        <DreamCalendar items={calendarItems} />
      )}
    </section>
  )
}
