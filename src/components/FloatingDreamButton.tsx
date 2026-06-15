'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ResultModal from '@/app/_components/ResultModal'

const GRADES = ['A', 'B', 'C', 'D', 'E', 'F']

function randomGrade() {
  return GRADES[Math.floor(Math.random() * GRADES.length)]
}

function randomLuckyNumbers() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  const result: number[] = []
  while (result.length < 6) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result.sort((a, b) => a - b)
}

const guides = [
  { label: '누가/무엇이', desc: '나 외에 등장한 특별한 존재나 기묘한 생명체, 인물은?' },
  { label: '언제/어디서', desc: '배경은 언제쯤, 어떤 공간이었나요?' },
  { label: '어떻게/왜',   desc: '어떤 신비롭거나 두려운 사건이 일어났고 어떻게 전개되었나요?' },
  { label: '강렬한 기억', desc: '잠에서 깨어난 순간에도 생생한 감정, 감각, 혹은 기억나는 대사는?' },
]

export default function FloatingDreamButton() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [dream, setDream]       = useState('')
  const [dreamError, setDreamError] = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<{ grade: string; luckyNumbers: number[] } | null>(null)

  async function handleOpen() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setDream('')
    setDreamError('')
    setResult(null)
    setLoading(false)
  }

  function handleSubmit() {
    if (!dream.trim()) { setDreamError('꿈 내용을 입력해주세요.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setResult({ grade: randomGrade(), luckyNumbers: randomLuckyNumbers() })
    }, 2500)
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={handleOpen}
        aria-label="꿈 감정하기"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#01273A] shadow-lg transition-transform hover:scale-105 hover:brightness-90"
      >
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 꿈 입력 모달 */}
      {open && !result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              aria-label="닫기"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="mb-6 text-center text-xl font-black text-[#01273A]">나의 꿈 감정하기</h2>

            {/* 가이드 */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-bold text-gray-500">스토리 완성 가이드 (5W1H)</p>
              <ul className="flex flex-col gap-2">
                {guides.map((g) => (
                  <li key={g.label} className="flex gap-2 text-sm leading-snug">
                    <span className="mt-0.5 shrink-0 text-gray-300">◆</span>
                    <span>
                      <span className="font-bold text-gray-600">{g.label}:</span>{' '}
                      <span className="text-gray-400">({g.desc})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <textarea
              value={dream}
              onChange={(e) => { setDream(e.target.value); setDreamError('') }}
              placeholder={`꿈의 내용을 최대한 자세하게 적어주세요.\n\n예) 어젯밤 꿈에서 커다란 뱀이 나타나 나를 쫓아왔어요...`}
              rows={6}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-[#01273A] placeholder:text-[#BBBBBB] outline-none focus:border-[#01273A]"
            />

            {dreamError && (
              <p className="mt-2 text-sm text-red-500">{dreamError}</p>
            )}

            <button
              onClick={handleSubmit}
              className="mt-4 w-full rounded-xl bg-[#01273A] py-4 text-lg font-black text-white transition-all hover:brightness-90"
            >
              나의 꿈 감정하기
            </button>
          </div>
        </div>
      )}

      {/* 로딩 모달 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white px-8 py-12 shadow-2xl text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-gray-400" />
            <div>
              <p className="text-lg font-black text-[#01273A]">무의식의 서사를 분석하고 있습니다...</p>
              <p className="mt-2 text-base text-[#777777]">해몽 결과와 가치를 산정하는 중입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 결과 모달 */}
      {result && (
        <ResultModal
          dream={dream}
          grade={result.grade}
          luckyNumbers={result.luckyNumbers}
          onClose={handleClose}
        />
      )}
    </>
  )
}
