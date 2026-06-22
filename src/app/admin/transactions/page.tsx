'use client'

import { useEffect, useState } from 'react'
import { getAdminTransactions } from '../actions'

type Tx = {
  id: number; price: number; created_at: string
  dreams: { id: number; title: string; grade: string } | null
  profiles: { nickname: string; username: string } | null
}

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-400', D: 'bg-orange-400', E: 'bg-red-400', F: 'bg-gray-400',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function AdminTransactions() {
  const [txs, setTxs]       = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminTransactions().then((data) => { setTxs(data as unknown as Tx[]); setLoading(false) })
  }, [])

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-4 text-xl font-bold text-[#01273A] sm:mb-6 sm:text-2xl">거래 내역</h1>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">구매자</th>
              <th className="px-6 py-3">꿈 제목</th>
              <th className="px-6 py-3">등급</th>
              <th className="px-6 py-3">금액</th>
              <th className="px-6 py-3">날짜</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-[#999]">불러오는 중...</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-[#999]">거래 내역이 없습니다</td></tr>
            ) : txs.map((tx, i) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-[#999]">{i + 1}</td>
                <td className="px-6 py-3">
                  <p className="text-[#333]">{tx.profiles?.nickname ?? '-'}</p>
                  <p className="text-xs text-[#999]">@{tx.profiles?.username ?? '-'}</p>
                </td>
                <td className="max-w-[220px] truncate px-6 py-3 text-[#555]">
                  {tx.dreams ? (
                    <a href={`/dream/${tx.dreams.id}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {tx.dreams.title}
                    </a>
                  ) : '-'}
                </td>
                <td className="px-6 py-3">
                  {tx.dreams && (
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[tx.dreams.grade] ?? 'bg-gray-400'}`}>
                      {tx.dreams.grade}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 font-semibold text-[#E07B2A]">{tx.price.toLocaleString()} P</td>
                <td className="px-6 py-3 text-[#999]">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && (
        <p className="mt-4 text-right text-sm text-[#999]">총 {txs.length}건 · 합계 {txs.reduce((s, t) => s + t.price, 0).toLocaleString()} P</p>
      )}
    </div>
  )
}
