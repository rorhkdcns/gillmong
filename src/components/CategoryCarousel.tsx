'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
  F: 'bg-gray-400',
}

interface Dream {
  id: number
  title: string
  grade: string
  price: number
  nickname?: string | null
}

function useVisibleCards() {
  const [visible, setVisible] = useState(3)
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640)  setVisible(1)
      else if (window.innerWidth < 1024) setVisible(2)
      else setVisible(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return visible
}

export default function CategoryCarousel({ dreams }: { dreams: Dream[] }) {
  const [current, setCurrent] = useState(0)
  const visible      = useVisibleCards()
  const touchStartX  = useRef(0)
  const maxIndex     = Math.max(0, dreams.length - visible)

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent(c => (c >= maxIndex ? 0 : c + 1)), [maxIndex])

  // 자동 슬라이드 (4초)
  useEffect(() => {
    if (dreams.length <= visible) return
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
  }, [dreams.length, visible, next])

  // 뷰포트 변경 시 인덱스 초기화
  useEffect(() => { setCurrent(0) }, [visible])

  if (dreams.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">등록된 꿈이 없습니다</p>
  }

  const cardWidth  = 100 / visible
  const translateX = -(current * cardWidth)

  return (
    <div className="relative px-5">
      {/* 슬라이드 영역 */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX}%)` }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX
            if (diff > 50) next()
            else if (diff < -50) prev()
          }}
        >
          {dreams.map((dream) => (
            <div key={dream.id} style={{ width: `${cardWidth}%` }} className="shrink-0 px-2">
              <Link
                href={`/dream/${dream.id}`}
                className="block h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[dream.grade] ?? 'bg-gray-400'}`}>
                    {dream.grade}
                  </span>
                  {dream.nickname && (
                    <span className="truncate text-xs text-gray-400">@{dream.nickname}</span>
                  )}
                </div>
                <h3 className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[#333]">
                  {dream.title}
                </h3>
                <p className="text-sm font-bold text-[#E07B2A]">{dream.price.toLocaleString()} P</p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 좌/우 버튼 */}
      {dreams.length > visible && (
        <>
          <button
            onClick={prev}
            disabled={current === 0}
            aria-label="이전"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-md text-[#01273A] transition hover:bg-[#01273A] hover:text-white disabled:opacity-30"
          >
            ‹
          </button>
          <button
            onClick={next}
            disabled={current >= maxIndex}
            aria-label="다음"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-md text-[#01273A] transition hover:bg-[#01273A] hover:text-white disabled:opacity-30"
          >
            ›
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {maxIndex > 0 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`${i + 1}번째`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-4 bg-[#01273A]' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
