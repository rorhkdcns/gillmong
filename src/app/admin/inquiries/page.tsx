'use client'

import { useState, useEffect } from 'react'
import { getAdminInquiries, adminAnswerInquiry } from '../actions'

type Inquiry = {
  id: number
  title: string
  content: string
  status: string
  answer: string | null
  created_at: string
  answered_at: string | null
  profiles: { nickname: string; username: string } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<number | null>(null)
  const [answer,    setAnswer]    = useState('')
  const [saving,    setSaving]    = useState(false)

  async function load() {
    setLoading(true)
    const data = await getAdminInquiries()
    setInquiries(data as Inquiry[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAnswer(id: number) {
    if (!answer.trim()) return
    setSaving(true)
    await adminAnswerInquiry(id, answer)
    setSaving(false)
    setAnswer('')
    setExpanded(null)
    load()
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-[#01273A]">1:1 문의 관리</h1>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : inquiries.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          접수된 문의가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded border border-gray-200 bg-white">
              <button
                onClick={() => { setExpanded(expanded === inq.id ? null : inq.id); setAnswer(inq.answer ?? '') }}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${inq.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inq.status === 'answered' ? '답변완료' : '대기중'}
                  </span>
                  <span className="truncate text-sm font-medium text-[#333]">{inq.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {inq.profiles?.nickname ?? '?'} (@{inq.profiles?.username ?? '?'})
                  </span>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{formatDate(inq.created_at)}</span>
              </button>

              {expanded === inq.id && (
                <div className="border-t border-gray-100 px-6 py-5">
                  <div className="mb-4 rounded-lg bg-gray-50 p-4">
                    <p className="mb-1 text-xs font-semibold text-gray-400">문의 내용</p>
                    <p className="text-sm text-[#333] whitespace-pre-line">{inq.content}</p>
                  </div>
                  {inq.status === 'answered' && inq.answer && (
                    <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                      <p className="mb-1 text-xs font-semibold text-emerald-600">기존 답변</p>
                      <p className="text-sm text-[#333] whitespace-pre-line">{inq.answer}</p>
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">답변 작성</label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={4}
                      placeholder="답변 내용을 입력하세요"
                      className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#01273A]"
                    />
                    <button
                      onClick={() => handleAnswer(inq.id)}
                      disabled={saving || !answer.trim()}
                      className="mt-2 rounded bg-[#01273A] px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
                    >
                      {saving ? '저장 중...' : '답변 등록'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
