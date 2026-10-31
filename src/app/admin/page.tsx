'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAdminStats, getPendingWithdrawals, getPendingPartnerships, getAcquisitionStats } from './actions'

type Acq = Awaited<ReturnType<typeof getAcquisitionStats>>

type Stats = Awaited<ReturnType<typeof getAdminStats>>
type PendingWithdrawal  = Awaited<ReturnType<typeof getPendingWithdrawals>>[number]
type PendingPartnership = Awaited<ReturnType<typeof getPendingPartnerships>>[number]

function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="block rounded border border-gray-200 bg-white p-4 transition-colors hover:border-[#E5421F] sm:p-6">
      <p className="text-sm text-[#6B605A]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#231C17] sm:text-3xl">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </Link>
  )
}

function RankList({ title, rows, hrefOf, empty }: { title: string; rows: [string, number][]; hrefOf?: (k: string) => string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3 sm:px-6"><h3 className="font-semibold text-[#231C17]">{title}</h3></div>
      <ul className="flex flex-col gap-2 p-4 text-sm sm:px-6">
        {rows.length === 0 && <li className="text-[#9A8F88]">{empty}</li>}
        {rows.map(([k, n]) => {
          const label = <span className="truncate">{k}</span>
          return (
            <li key={k} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[2px] px-2 py-1.5">
              <span aria-hidden className="absolute inset-y-0 left-0 bg-[#FFF1EA]" style={{ width: `${(n / max) * 100}%` }} />
              <span className="relative min-w-0 flex-1 text-[#3A322C]">
                {hrefOf ? <Link href={hrefOf(k)} className="hover:text-[#E5421F] hover:underline">{label}</Link> : label}
              </span>
              <strong className="relative text-[#231C17]">{n.toLocaleString()}</strong>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function AdminDashboard() {
  const [stats, setStats]                   = useState<Stats | null>(null)
  const [loading, setLoading]               = useState(true)
  const [withdrawals, setWithdrawals]       = useState<PendingWithdrawal[]>([])
  const [wLoading, setWLoading]             = useState(true)
  const [partnerships, setPartnerships]     = useState<PendingPartnership[]>([])
  const [pLoading, setPLoading]             = useState(true)
  const [acq, setAcq]                       = useState<Acq | null>(null)

  useEffect(() => {
    getAdminStats().then((s) => { setStats(s); setLoading(false) })
    getPendingWithdrawals().then((data) => { setWithdrawals(data); setWLoading(false) })
    getAcquisitionStats(30).then(setAcq)
    getPendingPartnerships().then((data) => { setPartnerships(data); setPLoading(false) })
  }, [])

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-[#9A8F88]">불러오는 중...</div>
  if (!stats) return null

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-[#231C17] sm:mb-8 sm:text-2xl">대시보드</h1>

      {/* 통계 카드 */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="총 회원수" value={stats.totalUsers} href="/admin/users" />
        <StatCard label="총 꿈 등록수" value={stats.totalDreams} href="/admin/dreams" />
        <StatCard label="총 거래수" value={stats.totalTransactions} href="/admin/transactions" />
        <StatCard label="총 거래금액" value={`${stats.totalPoints.toLocaleString()}원`} href="/admin/transactions" />
      </div>

      {/* 유입 통계 (최근 30일) */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-[#231C17]">유입 통계 <span className="text-sm font-normal text-[#6B605A]">최근 30일 · 방문 {acq ? acq.total.toLocaleString() : '-'}회</span></h2>
        </div>
        {acq && !acq.ready ? (
          <p className="rounded border border-dashed border-gray-300 bg-white p-5 text-sm text-[#6B605A]">
            유입 기록 저장소가 아직 준비되지 않았어요. Supabase에서 <code>20261031_site_settings_and_visits.sql</code>을 한 번 실행하면 이 자리에 통계가 쌓여요.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RankList title="어디서 들어왔나요" rows={acq?.sources ?? []} empty="아직 기록이 없어요" />
            <RankList title="어떤 검색어로 들어왔나요" rows={acq?.keywords ?? []} hrefOf={(k) => `/search?q=${encodeURIComponent(k)}`} empty="검색어가 확인된 방문이 아직 없어요" />
            <RankList title="처음 본 페이지" rows={acq?.landings ?? []} hrefOf={(k) => k} empty="아직 기록이 없어요" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 최근 가입 회원 */}
        <div className="rounded border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-[#231C17]">최근 가입 회원</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#9A8F88]">
                  <th className="px-6 py-3">닉네임</th>
                  <th className="px-6 py-3">아이디</th>
                  <th className="px-6 py-3">잔액</th>
                  <th className="px-6 py-3">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats.recentUsers as Array<{ id: string; nickname: string; username: string; points: number; created_at: string }>).map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3 text-[#3A322C]">{u.nickname}</td>
                    <td className="px-6 py-3 text-[#6B605A]">@{u.username}</td>
                    <td className="px-6 py-3 text-[#C23A18]">{u.points.toLocaleString()}원</td>
                    <td className="px-6 py-3 text-[#9A8F88]">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 최근 거래 */}
        <div className="rounded border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-[#231C17]">최근 거래</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#9A8F88]">
                  <th className="px-6 py-3">구매자</th>
                  <th className="px-6 py-3">꿈 제목</th>
                  <th className="px-6 py-3">금액</th>
                  <th className="px-6 py-3">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats.recentTx as unknown as Array<{ id: number; price: number; created_at: string; dreams: { title: string } | null; profiles: { nickname: string } | null }>).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-3 text-[#3A322C]">{tx.profiles?.nickname ?? '-'}</td>
                    <td className="max-w-[160px] truncate px-6 py-3 text-[#6B605A]">{tx.dreams?.title ?? '-'}</td>
                    <td className="px-6 py-3 text-[#C23A18]">{tx.price.toLocaleString()}원</td>
                    <td className="px-6 py-3 text-[#9A8F88]">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 대기 중인 출금신청 */}
      <div className="mt-6 rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-[#231C17]">대기 중인 출금신청</h2>
            {!wLoading && withdrawals.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {withdrawals.length}
              </span>
            )}
          </div>
          <Link
            href="/admin/withdrawals"
            className="text-xs text-[#231C17] hover:underline"
          >
            모두 보기 →
          </Link>
        </div>

        {wLoading ? (
          <div className="py-10 text-center text-sm text-[#9A8F88]">불러오는 중...</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#9A8F88]">대기 중인 출금신청이 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#9A8F88]">
                  <th className="px-4 py-3 sm:px-6">신청자</th>
                  <th className="px-4 py-3 sm:px-6">금액</th>
                  <th className="px-4 py-3 sm:px-6">은행 / 예금주</th>
                  <th className="px-4 py-3 sm:px-6">신청일시</th>
                  <th className="px-4 py-3 sm:px-6">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 sm:px-6">
                      <p className="font-medium text-[#3A322C]">{w.profiles?.nickname ?? '-'}</p>
                      <p className="text-xs text-[#9A8F88]">@{w.profiles?.username ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#C23A18] sm:px-6">
                      {w.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-[#6B605A] sm:px-6">
                      <p>{w.bank_name ?? '-'}</p>
                      <p className="text-xs text-[#9A8F88]">{w.account_holder ?? '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#9A8F88] sm:px-6">
                      {formatDateTime(w.created_at)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Link
                        href="/admin/withdrawals"
                        className="rounded bg-[#231C17] px-3 py-1 text-xs text-white hover:brightness-90"
                      >
                        처리하기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 대기 중인 제휴문의 */}
      <div className="mt-6 rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-[#231C17]">대기 중인 제휴문의</h2>
            {!pLoading && partnerships.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-primary px-1.5 text-xs font-bold text-white">
                {partnerships.length}
              </span>
            )}
          </div>
          <Link href="/admin/partnerships" className="text-xs text-[#231C17] hover:underline">
            모두 보기 →
          </Link>
        </div>

        {pLoading ? (
          <div className="py-10 text-center text-sm text-[#9A8F88]">불러오는 중...</div>
        ) : partnerships.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#9A8F88]">대기 중인 제휴문의가 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#9A8F88]">
                  <th className="px-4 py-3 sm:px-6">신청자</th>
                  <th className="px-4 py-3 sm:px-6">회사명</th>
                  <th className="px-4 py-3 sm:px-6">제목</th>
                  <th className="px-4 py-3 sm:px-6">신청일시</th>
                  <th className="px-4 py-3 sm:px-6">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partnerships.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-primary-light/30">
                    <td className="px-4 py-3 font-medium text-[#3A322C] sm:px-6">{p.name}</td>
                    <td className="px-4 py-3 text-[#6B605A] sm:px-6">{p.company ?? '-'}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#6B605A] sm:px-6">{p.title}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#9A8F88] sm:px-6">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Link
                        href="/admin/partnerships"
                        className="rounded bg-brand-primary px-3 py-1 text-xs text-white hover:brightness-90"
                      >
                        처리하기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
