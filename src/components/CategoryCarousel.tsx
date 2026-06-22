'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import DreamCard from '@/components/DreamCard'

interface Dream {
  id: number
  title: string
  body?: string | null
  grade: string
  price: number
  is_sold?: boolean
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
              <DreamCard {...dream} />
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
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-md text-[#01273A] transition hover:bg-[#01273A] hover:text-white disabled:opacity-30"
          >
            ‹
          </button>
          <button
            onClick={next}
            disabled={current >= maxIndex}
            aria-label="다음"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-md text-[#01273A] transition hover:bg-[#01273A] hover:text-white disabled:opacity-30"
          >
            ›
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {maxIndex > 0 && (
        <div className="mt-5 flex justify-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`${i + 1}번째`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-5 bg-[#01273A]' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
