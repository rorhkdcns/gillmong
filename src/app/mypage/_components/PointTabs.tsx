'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyWithdrawals } from '@/app/actions'

type TabKey = 'charge' | 'use' | 'revenue' | 'withdrawal'

const TAB_LABELS: Record<TabKey, string> = {
  charge:     '충전 내역 (종료)',
  use:        '사용 내역',
  revenue:    '수익 내역',
  withdrawal: '출금 내역',
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '처리 중', color: 'text-amber-500' },
  approved: { label: '완료',    color: 'text-emerald-600' },
  rejected: { label: '반려',    color: 'text-red-400' },
}

interface LogRow {
  date: string
  description: string
  amount: number
}

interface WithdrawalRow {
  id: number
  date: string
  bankName: string
  amount: number
  status: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function PointTabs() {
  const [active, setActive]           = useState<TabKey>('charge')
  const [logs, setLogs]               = useState<Record<'charge' | 'use' | 'revenue', LogRow[]>>({ charge: [], use: [], revenue: [] })
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const [{ data: pointData }, wData] = await Promise.all([
        supabase
          .from('point_logs')
          .select('amount, type, description, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        getMyWithdrawals(),
      ])

      const buckets: Record<'charge' | 'use' | 'revenue', LogRow[]> = { charge: [], use: [], revenue: [] }
      for (const row of pointData ?? []) {
        const entry: LogRow = { date: formatDate(row.created_at), description: row.description ?? '', amount: row.amount }
        if (row.type === 'charge')      buckets.charge.push(entry)
        else if (row.type === 'use')    buckets.use.push(entry)
        else if (row.type === 'earn')   buckets.revenue.push(entry)
      }

      setLogs(buckets)
      setWithdrawals(wData.map(w => ({
        id:       w.id,
        date:     formatDate(w.created_at),
        bankName: w.bank_name,
        amount:   w.amount,
        status:   w.status,
      })))
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <div className="mt-6">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`flex-1 whitespace-nowrap py-3 text-center text-sm font-medium transition-colors ${
              active === key
                ? 'border-b-2 border-[#01273A] font-bold text-[#01273A]'
                : 'text-[#555555] hover:text-[#333333]'
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* 내역 */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[#555555]">불러오는 중...</p>
      ) : active === 'withdrawal' ? (
        withdrawals.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#555555]">출금 내역이 없습니다</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {withdrawals.map((w) => {
              const st = STATUS_LABEL[w.status] ?? { label: w.status, color: 'text-gray-400' }
              return (
                <li key={w.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-base font-medium text-[#333333]">{w.bankName} 출금 신청</p>
                    <p className="mt-0.5 text-xs text-[#666666]">{w.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-red-400">-{w.amount.toLocaleString()}원</p>
                    <p className={`mt-0.5 text-xs font-semibold ${st.color}`}>{st.label}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )
      ) : logs[active as 'charge' | 'use' | 'revenue'].length === 0 ? (
        <p className="py-8 text-center text-sm text-[#555555]">내역이 없습니다</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {logs[active as 'charge' | 'use' | 'revenue'].map((row, i) => (
            <li key={i} className="flex items-center justify-between py-4">
              <div>
                <p className="text-base font-medium text-[#333333]">{row.description}</p>
                <p className="mt-0.5 text-xs text-[#666666]">{row.date}</p>
              </div>
              <span className={`text-base font-bold ${row.amount > 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                {row.amount > 0 ? '+' : ''}{row.amount.toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
