'use client'

import { useEffect, useState } from 'react'
import { getAdminWithdrawals, adminHandleWithdrawal } from '../actions'

type Withdrawal = {
  id: number; user_id: string; amount: number; status: string
  bank_name?: string; account_number?: string; account_holder?: string
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:  { label: '대기중',  cls: 'bg-amber-50 text-amber-600' },
  approved: { label: '승인완료', cls: 'bg-emerald-50 text-emerald-600' },
  rejected: { label: '거절',    cls: 'bg-red-50 text-red-500' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminWithdrawals() {
  const [items, setItems]     = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [tableError, setTableError] = useState('')
  const [working, setWorking] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const res = await getAdminWithdrawals()
    if (res.error) setTableError(res.error)
    else setItems(res.data as Withdrawal[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handle(id: number, action: 'approve' | 'reject') {
    setWorking(id)
    await adminHandleWithdrawal(id, action)
    setWorking(null)
    load()
  }

  if (tableError) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-[#01273A]">출금 신청 관리</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
          <p className="font-semibold">withdrawals 테이블이 없습니다.</p>
          <p className="mt-1">Supabase에서 아래 SQL을 실행해 테이블을 생성해주세요.</p>
          <pre className="mt-4 overflow-x-auto rounded bg-white p-4 text-xs text-gray-700">{`CREATE TABLE withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-[#01273A]">출금 신청 관리</h1>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
              <th className="px-6 py-3">신청일</th>
              <th className="px-6 py-3">금액</th>
              <th className="px-6 py-3">은행</th>
              <th className="px-6 py-3">계좌번호</th>
              <th className="px-6 py-3">예금주</th>
              <th className="px-6 py-3">상태</th>
              <th className="px-6 py-3">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[#999]">불러오는 중...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[#999]">출금 신청이 없습니다</td></tr>
            ) : items.map((w) => {
              const st = STATUS_LABEL[w.status] ?? { label: w.status, cls: 'bg-gray-100 text-gray-500' }
              return (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-[#999]">{formatDate(w.created_at)}</td>
                  <td className="px-6 py-3 font-semibold text-[#E07B2A]">{w.amount.toLocaleString()} P</td>
                  <td className="px-6 py-3 text-[#555]">{w.bank_name ?? '-'}</td>
                  <td className="px-6 py-3 text-[#555]">{w.account_number ?? '-'}</td>
                  <td className="px-6 py-3 text-[#555]">{w.account_holder ?? '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-6 py-3">
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handle(w.id, 'approve')} disabled={working === w.id}
                          className="rounded bg-emerald-500 px-3 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-60">
                          승인
                        </button>
                        <button onClick={() => handle(w.id, 'reject')} disabled={working === w.id}
                          className="rounded border border-red-300 px-3 py-1 text-xs text-red-500 hover:border-red-500 disabled:opacity-60">
                          거절
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
