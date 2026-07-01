'use client'

import { useEffect, useState } from 'react'
import { getAdminOrders, adminSettleOrder, adminRefundOrder } from '../actions'

type Order = {
  id: string
  buyer_id: string
  seller_id: string
  dream_id: number
  amount: number
  seller_amount: number
  payment_method: string
  status: string
  paid_at: string
  confirm_deadline: string | null
  dispute_reason: string | null
  settled_at: string | null
  buyer_profile: { nickname: string; username: string } | null
  seller_profile: { nickname: string; username: string } | null
  dream_title: string | null
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:     { label: '결제대기',   cls: 'bg-gray-100 text-gray-500' },
  paid_escrow: { label: '에스크로중', cls: 'bg-amber-50 text-amber-600' },
  confirmed:   { label: '확정',       cls: 'bg-blue-50 text-blue-600' },
  settled:     { label: '정산완료',   cls: 'bg-emerald-50 text-emerald-600' },
  disputed:    { label: '분쟁중',     cls: 'bg-red-50 text-red-600' },
  refunded:    { label: '환불완료',   cls: 'bg-purple-50 text-purple-600' },
}

type TabKey = 'paid_escrow' | 'disputed' | 'settled'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'paid_escrow', label: '정산대기' },
  { key: 'disputed',    label: '분쟁' },
  { key: 'settled',     label: '정산완료' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function daysLeft(deadline: string | null) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AdminOrdersPage() {
  const [tab, setTab]         = useState<TabKey>('paid_escrow')
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const data = await getAdminOrders(tab)
    setOrders(data as Order[])
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  async function handleSettle(id: string) {
    setWorking(id)
    await adminSettleOrder(id)
    setWorking(null)
    load()
  }

  async function handleRefund(id: string) {
    setWorking(id)
    await adminRefundOrder(id)
    setWorking(null)
    load()
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-[#01273A] sm:text-2xl">에스크로 주문 관리</h1>

      <div className="mb-6 flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#01273A] font-bold text-[#01273A]'
                : 'text-gray-500 hover:text-[#01273A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
              <th className="px-4 py-3">결제일</th>
              <th className="px-4 py-3">꿈 제목</th>
              <th className="px-4 py-3">구매자</th>
              <th className="px-4 py-3">판매자</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">상태</th>
              {tab === 'paid_escrow' && <th className="px-4 py-3">자동정산</th>}
              {tab === 'disputed' && <th className="px-4 py-3">분쟁 사유</th>}
              {(tab === 'paid_escrow' || tab === 'disputed') && <th className="px-4 py-3">처리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-[#999]">불러오는 중...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-[#999]">주문이 없습니다</td></tr>
            ) : orders.map((o) => {
              const st   = STATUS_META[o.status] ?? { label: o.status, cls: 'bg-gray-100 text-gray-500' }
              const days = daysLeft(o.confirm_deadline)
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#999] whitespace-nowrap">{formatDate(o.paid_at)}</td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-[#555]">{o.dream_title ?? '-'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#333]">{o.buyer_profile?.nickname ?? '-'}</p>
                    <p className="text-xs text-[#999]">@{o.buyer_profile?.username ?? '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#333]">{o.seller_profile?.nickname ?? '-'}</p>
                    <p className="text-xs text-[#999]">@{o.seller_profile?.username ?? '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#E07B2A]">₩{o.amount.toLocaleString()}</p>
                    <p className="text-xs text-[#999]">판매자 {o.seller_amount.toLocaleString()}원</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </td>
                  {tab === 'paid_escrow' && (
                    <td className="px-4 py-3 text-xs text-[#777]">
                      {days !== null ? (
                        days <= 0
                          ? <span className="text-red-500 font-semibold">오늘 자동정산</span>
                          : `${days}일 후`
                      ) : '-'}
                    </td>
                  )}
                  {tab === 'disputed' && (
                    <td className="max-w-[200px] px-4 py-3 text-xs text-red-600">{o.dispute_reason ?? '-'}</td>
                  )}
                  {tab === 'paid_escrow' && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSettle(o.id)}
                        disabled={working === o.id}
                        className="rounded bg-emerald-500 px-3 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-60"
                      >
                        즉시정산
                      </button>
                    </td>
                  )}
                  {tab === 'disputed' && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSettle(o.id)}
                          disabled={working === o.id}
                          className="rounded bg-emerald-500 px-3 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-60"
                        >
                          승인(정산)
                        </button>
                        <button
                          onClick={() => handleRefund(o.id)}
                          disabled={working === o.id}
                          className="rounded border border-red-300 px-3 py-1 text-xs text-red-500 hover:border-red-500 disabled:opacity-60"
                        >
                          반려(환불)
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
