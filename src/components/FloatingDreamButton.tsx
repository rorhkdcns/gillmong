'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ResultModal, { type AnalysisResult } from '@/app/_components/ResultModal'
import { DREAM_FIELDS } from '@/app/_components/DreamInput'
import { useRemainingCount } from '@/hooks/useRemainingCount'

type Answers = { who: string; when: string; how: string; memory: string }

export default function FloatingDreamButton() {
  const router = useRouter()
  const { remaining, fetchRemaining } = useRemainingCount()

  const [open, setOpen]                             = useState(false)
  const [answers, setAnswers]                       = useState<Answers>({ who: '', when: '', how: '', memory: '' })
  const [inputError, setInputError]                 = useState('')
  const [isRetryable, setIsRetryable]               = useState(false)
  const [loading, setLoading]                       = useState(false)
  const [result, setResult]                         = useState<AnalysisResult | null>(null)
  const [reconstructedDream, setReconstructedDream] = useState('')
  const [dailyLimitReached, setDailyLimitReached]   = useState(false)
  const [focusedKey, setFocusedKey]                 = useState<keyof Answers | null>(null)

  async function handleOpen() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/auth/login'); return }
    const r = await fetchRemaining()
    if (typeof r === 'number' && r <= 0) setDailyLimitReached(true)
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
    setDailyLimitReached(false)
    setFocusedKey(null)
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
      const res  = await fetch('/api/analyze-dream', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (res.status === 429) { setDailyLimitReached(true); setLoading(false); return }
      if (res.status === 503) { setInputError(data.error); setIsRetryable(true); setLoading(false); return }
      if (!res.ok || data.error) throw new Error(data.error ?? '분석 실패')
      const { reconstructedDream: rd, ...analysis } = data
      setReconstructedDream(rd ?? '')
      setResult(analysis as AnalysisResult)
      window.dispatchEvent(new Event('dream-analyzed'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setInputError(`해몽 분석 중 오류가 발생했습니다: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const totalChars  = Object.values(answers).reduce((s, v) => s + v.trim().length, 0)
  const fillPercent = Math.min(100, Math.round((totalChars / 80) * 100))
  const fillLabel   = fillPercent >= 100 ? '상세함 ✓' : fillPercent >= 50 ? '보통' : '간략함'
  const fillColor   = fillPercent >= 100 ? 'bg-emerald-400' : fillPercent >= 50 ? 'bg-[#E07B2A]' : 'bg-gray-300'

  return (
    <>
      {/* 플로팅 버튼 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleOpen}
          disabled={remaining === 0}
          aria-label="꿈 감정하기"
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform ${
            remaining === 0
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-[#01273A] hover:scale-105 hover:brightness-90'
          }`}
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {remaining !== null && (
            <span className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-black text-white ${
              remaining === 0 ? 'bg-gray-500' : 'bg-[#E07B2A]'
            }`}>
              {remaining}
            </span>
          )}
        </button>
      </div>

      {/* 꿈 입력 모달 */}
      {open && !result && !loading && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/60 px-4 pb-8 pt-[84px]">
          <div className="relative mx-auto w-full max-w-2xl rounded-2xl bg-white p-7 shadow-2xl">

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

            <h2 className="mb-5 text-center text-xl font-black text-[#01273A]">나의 꿈 감정하기</h2>

            {dailyLimitReached ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
                <p className="mb-1 text-3xl">🌙</p>
                <p className="font-black text-[#01273A]">오늘의 해몽 횟수를 모두 사용하셨습니다</p>
                <p className="mt-2 text-sm text-amber-700">하루 3회 제공되며, 자정에 다시 초기화됩니다.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {/* 정확도 안내 배너 */}
                <div className="rounded-xl border-l-4 border-[#E07B2A] bg-[#01273A]/5 px-3.5 py-3">
                  <p className="text-sm font-bold text-[#01273A]">더 상세하게 적을수록 해몽이 정확해집니다</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#444444]">
                    색상·냄새·온도·감정까지 떠오르는 대로 적어보세요. 단어 하나가 해몽의 방향을 바꿉니다.
                  </p>
                </div>

                {/* 입력 필드 */}
                {DREAM_FIELDS.map((field) => {
                  const charCount = answers[field.key].length
                  const isFocused = focusedKey === field.key
                  return (
                    <div key={field.key}>
                      <label className="mb-0.5 block text-base font-bold text-[#01273A]">
                        {field.label}
                      </label>
                      <p className="mb-1 text-xs font-medium text-[#555555]">{field.desc}</p>

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
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pb-6 text-sm text-[#01273A] placeholder:text-[#BBBBBB] outline-none transition-all focus:border-[#01273A] focus:shadow-[0_0_0_3px_rgba(1,39,58,0.08)]"
                        />
                        {/* 글자 수 */}
                        <span className={`absolute bottom-2 right-3 text-xs transition-colors ${
                          charCount === 0 ? 'text-transparent' : charCount >= 30 ? 'text-[#E07B2A] font-semibold' : 'text-[#AAAAAA]'
                        }`}>
                          {charCount}자{charCount >= 30 ? ' ✓' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* 작성량 진행바 */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-[#555555]">
                    <span>작성 충실도</span>
                    <span className={fillPercent >= 100 ? 'font-bold text-emerald-500' : fillPercent >= 50 ? 'font-semibold text-[#E07B2A]' : 'text-[#888888]'}>
                      {fillLabel}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
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
                  <p className="text-center text-sm text-[#777777]">
                    오늘 해몽{' '}
                    <span className={`font-bold ${remaining === 0 ? 'text-red-400' : 'text-[#E07B2A]'}`}>{remaining}회</span>
                    {' '}남음
                  </p>
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
            )}
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
