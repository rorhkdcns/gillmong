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

const GRADE_LABEL: Record<string, string> = {
  A: 'A등급', B: 'B등급', C: 'C등급', D: 'D등급', E: 'E등급', F: 'F등급',
}

interface Dream {
  id: number
  title: string
  summary?: string | null
  grade: string
  price: number
  nickname?: string | null
  username?: string | null
}

function DreamCard({ dream }: { dream: Dream }) {
  const initial = dream.nickname?.[0]?.toUpperCase() ?? '?'
  return (
    <Link
      href={`/dream/${dream.id}`}
      className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* ① 프로필 */}
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#01273A] text-sm font-bold text-white">
          {initial}
        </div>
        <span className="truncate text-xs text-gray-400">
          @{dream.username ?? dream.nickname ?? '-'}
        </span>
      </div>

      {/* ② 제목 */}
      <div className="px-4 pt-3">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#01273A]">
          {dream.title}
        </h3>
      </div>

      {/* ③ 요약 */}
      <div className="flex-1 px-4 pt-2">
        <p className="line-clamp-3 text-xs leading-relaxed text-gray-500">
          {dream.summary ?? ''}
        </p>
      </div>

      {/* ④ 등급 + 감정가 */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-bold text-white ${GRADE_COLOR[dream.grade] ?? 'bg-gray-400'}`}>
          {dream.grade}
          <span className="font-normal opacity-80">&nbsp;{GRADE_LABEL[dream.grade]}</span>
        </span>
        <span className="text-sm font-extrabold text-[#E07B2A]">
          {dream.price.toLocaleString()} P
        </span>
      </div>

      {/* ⑤ 버튼 */}
      <div className="flex justify-end px-4 pb-4 pt-3">
        <span className="rounded-full bg-[#01273A] px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-[#E07B2A]">
          자세히 보기
        </span>
      </div>
    </Link>
  )
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
              <DreamCard dream={dream} />
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
