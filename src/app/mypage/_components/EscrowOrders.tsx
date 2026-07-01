'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  paid_escrow: { label: '에스크로중',  cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmed:   { label: '구매확정',    cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  settled:     { label: '정산완료',    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  disputed:    { label: '분쟁처리중',  cls: 'bg-red-50 text-red-600 border border-red-200' },
  refunded:    { label: '환불완료',    cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
}

type Order = {
  id: string
  dream_id: number
  amount: number
  status: string
  paid_at: string
  confirm_deadline: string | null
  dream_title: string | null
}

function daysLeft(deadline: string | null) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function EscrowOrders({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [working, setWorking]         = useState<string | null>(null)
  const [disputeId, setDisputeId]     = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [error, setError]             = useState('')

  if (orders.length === 0) return null

  async function handleConfirm(id: string) {
    setWorking(id)
    setError('')
    const res = await fetch(`/api/orders/${id}/confirm`, { method: 'POST' })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? '오류 발생')
    }
    setWorking(null)
    router.refresh()
  }

  async function handleDispute(id: string) {
    if (!disputeReason.trim() || disputeReason.trim().length < 5) {
      setError('환불 사유를 5자 이상 입력해주세요')
      return
    }
    setWorking(id)
    setError('')
    const res = await fetch(`/api/orders/${id}/dispute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason: disputeReason }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? '오류 발생')
    }
    setDisputeId(null)
    setDisputeReason('')
    setWorking(null)
    router.refresh()
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
      <h2 className="mb-5 text-xl font-black text-[#01273A]">결제 주문 내역</h2>
      <ul className="divide-y divide-gray-100">
        {orders.map((o) => {
          const st   = STATUS_META[o.status] ?? { label: o.status, cls: 'bg-gray-100 text-gray-500' }
          const days = daysLeft(o.confirm_deadline)
          return (
            <li key={o.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <a
                    href={`/dream/${o.dream_id}`}
                    className="block truncate text-base font-semibold text-[#333] hover:text-[#E07B2A]"
                  >
                    {o.dream_title ?? `꿈 #${o.dream_id}`}
                  </a>
                  <p className="mt-0.5 text-xs text-[#999]">{formatDate(o.paid_at)} · ₩{o.amount.toLocaleString()}</p>
                  {o.status === 'paid_escrow' && days !== null && (
                    <p className="mt-0.5 text-xs text-amber-500">
                      {days <= 0 ? '오늘 자동 구매확정' : `${days}일 후 자동 구매확정`}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                  {st.label}
                </span>
              </div>

              {o.status === 'paid_escrow' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleConfirm(o.id)}
                    disabled={working === o.id}
                    className="rounded-lg bg-[#01273A] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                  >
                    {working === o.id ? '처리 중...' : '구매확정'}
                  </button>
                  <button
                    onClick={() => { setDisputeId(o.id); setDisputeReason(''); setError('') }}
                    disabled={working === o.id}
                    className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-500 transition hover:border-red-500 disabled:opacity-50"
                  >
                    환불요청
                  </button>
                </div>
              )}

              {/* 환불 사유 입력 */}
              {disputeId === o.id && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-2 text-xs font-semibold text-red-600">환불 사유 입력</p>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="환불 사유를 5자 이상 입력해주세요"
                    className="mb-3 w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-[#333] outline-none focus:border-red-400"
                    rows={3}
                  />
                  {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDispute(o.id)}
                      disabled={working === o.id}
                      className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      {working === o.id ? '처리 중...' : '환불 요청 제출'}
                    </button>
                    <button
                      onClick={() => { setDisputeId(null); setError('') }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-xs text-gray-500 transition hover:border-gray-400"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {error && !disputeId && (
        <p className="mt-3 text-center text-sm text-red-500">{error}</p>
      )}
    </section>
  )
}
