'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ResultModal, { type AnalysisResult } from '@/app/_components/ResultModal'

const FIELDS = [
  {
    key: 'who' as const,
    label: '누가/무엇이',
    desc: '나 외에 등장한 특별한 존재나 기묘한 생명체, 인물은?',
    placeholder: '예) 거대한 용, 돌아가신 할머니, 낯선 남자...',
  },
  {
    key: 'when' as const,
    label: '언제/어디서',
    desc: '배경은 언제쯤, 어떤 공간이었나요?',
    placeholder: '예) 깊은 밤, 낯선 폐건물 안, 어릴 적 살던 집...',
  },
  {
    key: 'how' as const,
    label: '어떻게/왜',
    desc: '어떤 신비롭거나 두려운 사건이 일어났고 어떻게 전개되었나요?',
    placeholder: '예) 갑자기 쫓기다가 날아올랐고, 하늘에서 빛이 쏟아졌어요...',
  },
  {
    key: 'memory' as const,
    label: '강렬한 기억',
    desc: '잠에서 깨어난 순간에도 생생한 감정, 감각, 혹은 기억나는 대사는?',
    placeholder: '예) 심장이 두근거렸고 "돌아오지 마"라는 목소리가 들렸어요...',
  },
]

type Answers = { who: string; when: string; how: string; memory: string }

export default function FloatingDreamButton() {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [answers, setAnswers] = useState<Answers>({ who: '', when: '', how: '', memory: '' })
  const [inputError, setInputError]                 = useState('')
  const [isRetryable, setIsRetryable]               = useState(false)
  const [loading, setLoading]                       = useState(false)
  const [result, setResult]                         = useState<AnalysisResult | null>(null)
  const [reconstructedDream, setReconstructedDream] = useState('')

  async function handleOpen() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/auth/login'); return }
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setAnswers({ who: '', when: '', how: '', memory: '' })
    setInputError('')
    setIsRetryable(false)
    setResult(null)
    setReconstructedDream('')
    setLoading(false)
  }

  function handleChange(key: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setInputError('')
    setIsRetryable(false)
  }

  async function handleSubmit() {
    const hasInput = Object.values(answers).some((v) => v.trim())
    if (!hasInput) { setInputError('최소 하나 이상의 항목을 입력해주세요.'); return }
    setInputError('')
    setIsRetryable(false)
    setLoading(true)

    try {
      const res = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (res.status === 429) { setInputError(data.error); setLoading(false); return }
      if (res.status === 503) { setInputError(data.error); setIsRetryable(true); setLoading(false); return }
      if (!res.ok || data.error) throw new Error(data.error ?? '분석 실패')
      const { reconstructedDream: rd, ...analysis } = data
      setReconstructedDream(rd ?? '')
      setResult(analysis as AnalysisResult)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setInputError(`해몽 분석 중 오류가 발생했습니다: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="꿈 감정하기"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#01273A] shadow-lg transition-transform hover:scale-105 hover:brightness-90"
      >
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 꿈 입력 모달 — X 버튼으로만 닫힘 */}
      {open && !result && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl">

            {/* X 버튼 */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              aria-label="닫기"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="mb-6 text-center text-xl font-black text-[#01273A]">나의 꿈 감정하기</h2>

            <div className="flex flex-col gap-4">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-sm font-bold text-[#01273A]">
                    {field.label}
                    <span className="ml-1 font-normal text-xs text-gray-400">({field.desc})</span>
                  </label>
                  <textarea
                    value={answers[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#01273A] placeholder:text-[#BBBBBB] outline-none focus:border-[#01273A]"
                  />
                </div>
              ))}

              {inputError && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-500">{inputError}</p>
                  {isRetryable && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="self-start rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60"
                    >
                      재시도
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-xl bg-[#01273A] py-4 text-lg font-black text-white transition-all hover:brightness-90 disabled:opacity-60"
              >
                나의 꿈 감정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 모달 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white px-8 py-12 shadow-2xl text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-[#01273A]" />
            <div>
              <p className="text-lg font-black text-[#01273A]">무의식의 서사를 분석하고 있습니다...</p>
              <p className="mt-2 text-base text-[#777777]">AI가 꿈의 상징과 의미를 해석하는 중입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 결과 모달 */}
      {result && (
        <ResultModal
          dream={reconstructedDream}
          analysis={result}
          onClose={handleClose}
        />
      )}
    </>
  )
}
