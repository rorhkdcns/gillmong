'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const REASONS = ['스팸', '부적절한 내용', '저작권 침해', '기타'] as const

interface Props {
  dreamId: number
  onClose: () => void
}

export default function ReportModal({ dreamId, onClose }: Props) {
  const [reason, setReason]         = useState<string>(REASONS[0])
  const [detail, setDetail]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setError('로그인이 필요합니다.')
      setSubmitting(false)
      return
    }
    const { error: insertErr } = await supabase.from('reports').insert({
      dream_id:    dreamId,
      reporter_id: session.user.id,
      reason,
      detail:      detail.trim() || null,
      status:      'pending',
    })
    setSubmitting(false)
    if (insertErr) {
      setError('신고 제출에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setDone(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        {done ? (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mb-3 text-center text-xl text-[#01273A]">신고 완료</h2>
            <p className="mb-6 text-center text-sm text-[#555555]">
              신고가 접수되었습니다.<br />검토 후 신속하게 조치하겠습니다.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-[#01273A] py-3 font-semibold text-white hover:brightness-90"
            >
              닫기
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-6 text-center text-xl text-[#01273A]">신고하기</h2>

            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-[#333333]">신고 이유</p>
              <div className="flex flex-col gap-2.5">
                {REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="h-4 w-4 accent-[#01273A]"
                    />
                    <span className="text-sm text-[#333333]">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-semibold text-[#333333]">
                상세 내용{' '}
                <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="신고 내용을 자세히 입력해주세요"
                rows={3}
                maxLength={500}
                className="w-full resize-none border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]"
              />
            </div>

            {error && (
              <p className="mb-4 text-center text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 border border-gray-300 py-3 text-sm text-[#555555] transition-colors hover:border-[#01273A] hover:text-[#01273A]"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? '신고 중...' : '신고하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
