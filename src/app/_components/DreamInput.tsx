'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ResultModal, { type AnalysisResult } from './ResultModal'

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

export default function DreamInput() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Answers>({ who: '', when: '', how: '', memory: '' })
  const [inputError, setInputError]             = useState('')
  const [isRetryable, setIsRetryable]           = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [modal, setModal]                       = useState<AnalysisResult | null>(null)
  const [reconstructedDream, setReconstructedDream] = useState('')
  const [dailyLimitReached, setDailyLimitReached] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    async function checkLimit() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const res = await fetch('/api/dream-remaining', { cache: 'no-store' })
      if (!res.ok) return
      const { remaining: r } = await res.json()
      setRemaining(r)
      if (r <= 0) setDailyLimitReached(true)
    }
    checkLimit()

    function onAnalyzed() { checkLimit() }
    window.addEventListener('dream-analyzed', onAnalyzed)
    return () => window.removeEventListener('dream-analyzed', onAnalyzed)
  }, [])

  function handleChange(key: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setInputError('')
    setIsRetryable(false)
  }

  async function handleSubmit() {
    const hasInput = Object.values(answers).some((v) => v.trim())
    if (!hasInput) { setInputError('최소 하나 이상의 항목을 입력해주세요.'); return }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/auth/login'); return }

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
      if (res.status === 429) { setDailyLimitReached(true); return }
      if (res.status === 503) { setInputError(data.error); setIsRetryable(true); return }
      if (!res.ok || data.error) throw new Error(data.error ?? '분석 실패')
      const { reconstructedDream: rd, ...analysis } = data
      setReconstructedDream(rd ?? '')
      setModal(analysis as AnalysisResult)
      window.dispatchEvent(new Event('dream-analyzed'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setInputError(`해몽 분석 중 오류가 발생했습니다: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (dailyLimitReached) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
        <p className="text-3xl mb-3">🌙</p>
        <p className="font-black text-[#01273A] text-lg">오늘의 해몽 횟수를 모두 사용하셨습니다</p>
        <p className="mt-2 text-sm text-amber-700">하루 3회 제공되며, 자정에 다시 초기화됩니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-base font-bold text-[#01273A]">
              {field.label}
              <span className="ml-1 font-normal text-sm text-gray-400">({field.desc})</span>
            </label>
            <textarea
              value={answers[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={2}
              className="w-full resize-none rounded-xl border border-brand-border bg-white px-4 py-3 text-base text-brand-heading placeholder:text-[#BBBBBB] outline-none focus:border-[#01273A]"
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

        {remaining !== null && (
          <p className="text-center text-sm">
            <span className="text-[#777777]">오늘 해몽 </span>
            <span className={`font-bold ${remaining === 0 ? 'text-red-400' : 'text-[#E07B2A]'}`}>
              {remaining}회
            </span>
            <span className="text-[#777777]"> 남음</span>
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl py-5 text-xl font-black text-white shadow-md transition-all hover:brightness-90 active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: '#01273A' }}
        >
          나의 꿈 감정하기
        </button>
      </div>

      {/* 로딩 모달 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white px-8 py-12 shadow-2xl text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-[#01273A]" />
            <div>
              <p className="text-lg font-black text-brand-heading">무의식의 서사를 분석하고 있습니다...</p>
              <p className="mt-2 text-base text-brand-muted">AI가 꿈의 상징과 의미를 해석하는 중입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 결과 모달 */}
      {modal && (
        <ResultModal
          dream={reconstructedDream}
          analysis={modal}
          onClose={() => { setModal(null); setReconstructedDream('') }}
        />
      )}
    </>
  )
}
