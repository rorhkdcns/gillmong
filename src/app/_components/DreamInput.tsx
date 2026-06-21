'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ResultModal, { type AnalysisResult } from './ResultModal'

export const DREAM_FIELDS = [
  {
    key:         'who' as const,
    label:       '누가/무엇이',
    desc:        '등장한 인물·생명체·상징적 존재를 적어주세요',
    tip:         '꿈 속 타인은 당신 내면의 투영입니다. 외모·표정·느낌까지 기억하세요.',
    placeholder: '예) 돌아가신 할머니가 흰 한복을 입고 미소 지으며 서 있었어요. 얼굴이 이상하게 어렸어요…',
  },
  {
    key:         'when' as const,
    label:       '언제/어디서',
    desc:        '꿈의 배경 시간대·장소·분위기를 적어주세요',
    tip:         '장소의 밝음/어두움, 좁음/넓음은 무의식의 심리 상태를 반영합니다.',
    placeholder: '예) 새벽 무렵, 어릴 때 살던 낡은 집 지하실이었어요. 습하고 냄새가 났어요…',
  },
  {
    key:         'how' as const,
    label:       '어떻게/왜',
    desc:        '꿈에서 일어난 핵심 사건과 흐름을 순서대로 적어주세요',
    tip:         '꿈 속 행동과 상황은 현실의 갈등·욕망을 상징합니다. 순서대로 최대한 자세히 적어보세요.',
    placeholder: '예) 누군가에게 쫓기다 갑자기 하늘을 날았어요. 아래로 거대한 강이 보이고 빛이 쏟아졌어요…',
  },
  {
    key:         'memory' as const,
    label:       '강렬한 기억',
    desc:        '잠에서 깬 후에도 남아있는 감정·감각·대사를 적어주세요',
    tip:         '깨어난 직후의 감정이 해몽의 핵심입니다. 두려움·설렘·슬픔 등 감정의 결을 표현해주세요.',
    placeholder: '예) 심장이 두근거리고 눈물이 났어요. "다시는 못 봐"라는 목소리가 귓가에 맴돌았어요…',
  },
]

type Answers = { who: string; when: string; how: string; memory: string }

export default function DreamInput() {
  const router = useRouter()
  const [answers, setAnswers]                       = useState<Answers>({ who: '', when: '', how: '', memory: '' })
  const [inputError, setInputError]                 = useState('')
  const [isRetryable, setIsRetryable]               = useState(false)
  const [loading, setLoading]                       = useState(false)
  const [modal, setModal]                           = useState<AnalysisResult | null>(null)
  const [reconstructedDream, setReconstructedDream] = useState('')
  const [dailyLimitReached, setDailyLimitReached]   = useState(false)
  const [remaining, setRemaining]                   = useState<number | null>(null)
  const [focusedKey, setFocusedKey]                 = useState<keyof Answers | null>(null)

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
    const onAnalyzed = () => checkLimit()
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
      const res  = await fetch('/api/analyze-dream', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answers }),
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

  // 전체 작성량 (각 항목 20자 기준, 총 80자 = 100%)
  const totalChars  = Object.values(answers).reduce((s, v) => s + v.trim().length, 0)
  const fillPercent = Math.min(100, Math.round((totalChars / 80) * 100))
  const fillLabel   = fillPercent >= 100 ? '상세함 ✓' : fillPercent >= 50 ? '보통' : '간략함'
  const fillColor   = fillPercent >= 100 ? 'bg-emerald-400' : fillPercent >= 50 ? 'bg-[#E07B2A]' : 'bg-gray-300'

  if (dailyLimitReached) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
        <p className="mb-3 text-3xl">🌙</p>
        <p className="text-lg font-black text-[#01273A]">오늘의 해몽 횟수를 모두 사용하셨습니다</p>
        <p className="mt-2 text-sm text-amber-700">하루 3회 제공되며, 자정에 다시 초기화됩니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* 정확도 안내 배너 */}
        <div className="flex items-start gap-3 rounded-xl border border-[#01273A]/10 bg-[#01273A]/5 px-4 py-3">
          <span className="mt-0.5 text-lg">✨</span>
          <div>
            <p className="text-sm font-bold text-[#01273A]">더 상세하게 적을수록 해몽이 정확해집니다</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#555555]">
              색상·냄새·온도·감정까지 떠오르는 대로 적어보세요. 단어 하나가 해몽의 방향을 바꿉니다.
            </p>
          </div>
        </div>

        {/* 입력 필드 */}
        {DREAM_FIELDS.map((field) => {
          const charCount = answers[field.key].length
          const isFocused = focusedKey === field.key
          return (
            <div key={field.key}>
              <label className="mb-1 block text-base font-bold text-[#01273A]">
                {field.label}
                <span className="ml-1.5 text-sm font-normal text-gray-400">{field.desc}</span>
              </label>

              {/* 심리학 팁 */}
              <p className="mb-1.5 flex items-center gap-1 text-xs text-[#6B96A8]">
                <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {field.tip}
              </p>

              <div className="relative">
                <textarea
                  value={answers[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={() => setFocusedKey(field.key)}
                  onBlur={() => setFocusedKey(null)}
                  placeholder={field.placeholder}
                  rows={isFocused ? 3 : 2}
                  className="w-full resize-none rounded-xl border border-brand-border bg-white px-4 py-3 pb-6 text-base text-brand-heading placeholder:text-[#BBBBBB] outline-none transition-all focus:border-[#01273A] focus:shadow-[0_0_0_3px_rgba(1,39,58,0.08)]"
                />
                {/* 글자 수 */}
                <span className={`absolute bottom-2 right-3 text-xs transition-colors ${
                  charCount === 0 ? 'text-transparent' : charCount >= 30 ? 'text-[#E07B2A] font-semibold' : 'text-gray-300'
                }`}>
                  {charCount}자{charCount >= 30 ? ' ✓' : ''}
                </span>
              </div>
            </div>
          )
        })}

        {/* 작성량 진행바 */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
            <span>작성 충실도</span>
            <span className={fillPercent >= 100 ? 'font-bold text-emerald-500' : fillPercent >= 50 ? 'text-[#E07B2A]' : ''}>
              {fillLabel}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          {fillPercent < 50 && totalChars > 0 && (
            <p className="mt-1 text-xs text-gray-400">각 항목을 20자 이상 작성하면 더 정확한 해몽이 가능합니다</p>
          )}
        </div>

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
            <span className={`font-bold ${remaining === 0 ? 'text-red-400' : 'text-[#E07B2A]'}`}>{remaining}회</span>
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
