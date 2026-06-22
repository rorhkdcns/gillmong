'use client'

import { useEffect, useState } from 'react'
import { getAdminStats } from './actions'

type Stats = Awaited<ReturnType<typeof getAdminStats>>

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6">
      <p className="text-sm text-[#777777]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#01273A]">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then((s) => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-[#999]">불러오는 중...</div>
  if (!stats) return null

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-[#01273A] sm:mb-8 sm:text-2xl">대시보드</h1>

      {/* 통계 카드 */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="총 회원수" value={stats.totalUsers} />
        <StatCard label="총 꿈 등록수" value={stats.totalDreams} />
        <StatCard label="총 거래수" value={stats.totalTransactions} />
        <StatCard label="총 충전 포인트" value={`${stats.totalPoints.toLocaleString()} P`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 최근 가입 회원 */}
        <div className="rounded border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-[#01273A]">최근 가입 회원</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                <th className="px-6 py-3">닉네임</th>
                <th className="px-6 py-3">아이디</th>
                <th className="px-6 py-3">포인트</th>
                <th className="px-6 py-3">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.recentUsers as Array<{ id: string; nickname: string; username: string; points: number; created_at: string }>).map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-3 text-[#333]">{u.nickname}</td>
                  <td className="px-6 py-3 text-[#777]">@{u.username}</td>
                  <td className="px-6 py-3 text-[#E07B2A]">{u.points.toLocaleString()} P</td>
                  <td className="px-6 py-3 text-[#999]">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* 최근 거래 */}
        <div className="rounded border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-[#01273A]">최근 거래</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                <th className="px-6 py-3">구매자</th>
                <th className="px-6 py-3">꿈 제목</th>
                <th className="px-6 py-3">금액</th>
                <th className="px-6 py-3">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.recentTx as unknown as Array<{ id: number; price: number; created_at: string; dreams: { title: string } | null; profiles: { nickname: string } | null }>).map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-3 text-[#333]">{tx.profiles?.nickname ?? '-'}</td>
                  <td className="max-w-[160px] truncate px-6 py-3 text-[#777]">{tx.dreams?.title ?? '-'}</td>
                  <td className="px-6 py-3 text-[#E07B2A]">{tx.price.toLocaleString()} P</td>
                  <td className="px-6 py-3 text-[#999]">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
