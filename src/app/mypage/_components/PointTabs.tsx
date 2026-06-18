'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type TabKey = 'charge' | 'use' | 'revenue'

const TAB_LABELS: Record<TabKey, string> = {
  charge:  '충전 내역',
  use:     '사용 내역',
  revenue: '수익 내역',
}

const TYPE_MAP: Record<TabKey, string> = {
  charge:  'charge',
  use:     'use',
  revenue: 'earn',
}

interface LogRow {
  date: string
  description: string
  amount: number
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function PointTabs() {
  const [active, setActive]   = useState<TabKey>('charge')
  const [logs, setLogs]       = useState<Record<TabKey, LogRow[]>>({ charge: [], use: [], revenue: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('point_logs')
        .select('amount, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const buckets: Record<TabKey, LogRow[]> = { charge: [], use: [], revenue: [] }

      for (const row of data ?? []) {
        const entry: LogRow = {
          date: formatDate(row.created_at),
          description: row.description ?? '',
          amount: row.amount,
        }
        if (row.type === 'charge') buckets.charge.push(entry)
        else if (row.type === 'use')  buckets.use.push(entry)
        else if (row.type === 'earn') buckets.revenue.push(entry)
      }

      setLogs(buckets)
      setLoading(false)
    }

    fetchLogs()
  }, [])

  const rows = logs[active]

  return (
    <div className="mt-6">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`px-5 py-2.5 text-sm transition-colors ${
              active === key
                ? 'border-b-2 border-[#01273A] font-semibold text-[#01273A]'
                : 'text-[#777777] hover:text-[#333333]'
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* 내역 */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[#999]">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#999]">내역이 없습니다</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <li key={i} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm text-[#333333]">{row.description}</p>
                <p className="mt-0.5 text-xs text-[#999]">{row.date}</p>
              </div>
              <span className={`text-sm font-semibold ${row.amount > 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                {row.amount > 0 ? '+' : ''}{row.amount.toLocaleString()} P
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
