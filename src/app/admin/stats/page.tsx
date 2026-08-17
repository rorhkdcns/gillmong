'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { getAdminStatsSummary, type AdminStatsSummary } from './actions'

const STATUS_LABELS: Record<string, string> = {
  pending: '결제대기',
  paid_escrow: '에스크로중',
  confirmed: '확정',
  settled: '정산완료',
  disputed: '분쟁중',
  refunded: '환불완료',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: '카드결제',
  vbank: '가상계좌',
}

// 카드/차트에서 재사용하는 브랜드 토큰 색 (DESIGN.md — 새 chart 전용 팔레트가 없어 기존 브랜드
// 확장 팔레트를 카테고리 구분용 flat 색으로 재사용한다).
const CHART_COLORS = [
  'var(--color-brand-primary)',
  'var(--color-brand-mint)',
  'var(--color-brand-gold)',
  'var(--color-brand-slate)',
  'var(--color-brand-primary-hover)',
]

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 sm:p-6">
      <p className="text-sm text-[#777777]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0B2433] sm:text-3xl">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="font-semibold text-[#0B2433]">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

function formatMonthDay(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${m}.${d}`
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStatsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStatsSummary().then((s) => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-[#999]">불러오는 중...</div>
  if (!stats) return null

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-[#0B2433] sm:mb-8 sm:text-2xl">통계</h1>

      {/* 핵심 지표 카드 (최근 30일) */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="총 매출 (최근 30일)" value={`${stats.revenue30d.toLocaleString()}원`} />
        <StatCard label="총 거래건수 (최근 30일)" value={stats.orderCount30d} />
        <StatCard label="평균 거래금액 (최근 30일)" value={`${stats.avgOrderAmount30d.toLocaleString()}원`} />
        <StatCard label="정산 대기 건수" value={stats.pendingSettlementCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 매출 추이 */}
        <div className="xl:col-span-2">
          <Panel title="매출 추이 (최근 30일)">
            {stats.dailyRevenue.every((d) => d.amount === 0) ? (
              <div className="py-10 text-center text-sm text-[#999]">최근 30일간 매출 데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stats.dailyRevenue} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E9EE" />
                  <XAxis dataKey="date" tickFormatter={formatMonthDay} tick={{ fontSize: 12, fill: '#5C6E7C' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5C6E7C' }} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`, '매출']} />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-brand-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* 결제수단별 비중 */}
        <Panel title="결제수단별 비중">
          {stats.byPaymentMethod.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#999]">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.byPaymentMethod}
                  dataKey="amount"
                  nameKey="method"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {stats.byPaymentMethod.map((entry, i) => (
                    <Cell key={entry.method} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${Number(value).toLocaleString()}원 (${item.payload.count}건)`,
                    PAYMENT_METHOD_LABELS[item.payload.method as string] ?? item.payload.method,
                  ]}
                />
                <Legend
                  formatter={(value: string) => PAYMENT_METHOD_LABELS[value] ?? value}
                  wrapperStyle={{ fontSize: 12, color: '#5C6E7C' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* 주문 상태별 현황 */}
        <Panel title="주문 상태별 현황">
          {stats.byStatus.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#999]">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.byStatus} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E9EE" />
                <XAxis
                  dataKey="status"
                  tickFormatter={(v) => STATUS_LABELS[v] ?? v}
                  tick={{ fontSize: 12, fill: '#5C6E7C' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5C6E7C' }} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}건`, '건수']}
                  labelFormatter={(label) => STATUS_LABELS[label as string] ?? label}
                />
                <Bar dataKey="count" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 인기 판매 꿈 TOP10 */}
        <Panel title="인기 판매 꿈 TOP 10">
          {stats.topDreams.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#999]">데이터가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-[#999]">
                    <th className="py-2 pr-3">꿈 제목</th>
                    <th className="py-2 pr-3">판매건수</th>
                    <th className="py-2">매출합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topDreams.map((d) => (
                    <tr key={d.dreamId}>
                      <td className="max-w-[160px] truncate py-2 pr-3">
                        <Link href={`/dream/${d.dreamId}`} className="text-[#333] hover:text-brand-primary hover:underline">
                          {d.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-[#555]">{d.salesCount.toLocaleString()}건</td>
                      <td className="py-2 text-[#14547A]">{d.revenue.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* 해몽사전 조회수 TOP10 */}
        <Panel title="해몽사전 조회수 TOP 10">
          {stats.topDictionary.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#999]">데이터가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-[#999]">
                    <th className="py-2 pr-3">표제어</th>
                    <th className="py-2">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topDictionary.map((d) => (
                    <tr key={d.slug}>
                      <td className="max-w-[160px] truncate py-2 pr-3">
                        <Link href={`/dictionary/${d.slug}`} className="text-[#333] hover:text-brand-primary hover:underline">
                          {d.keyword}
                        </Link>
                      </td>
                      <td className="py-2 text-[#555]">{d.viewCount.toLocaleString()}회</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* 굿즈샵 상품 클릭수 TOP10 */}
        <Panel title="굿즈샵 상품 클릭수 TOP 10">
          {stats.topProducts.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#999]">데이터가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-[#999]">
                    <th className="py-2 pr-3">상품명</th>
                    <th className="py-2">클릭수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topProducts.map((p, i) => (
                    <tr key={`${p.title}-${i}`}>
                      <td className="max-w-[160px] truncate py-2 pr-3 text-[#333]">{p.title}</td>
                      <td className="py-2 text-[#555]">{p.clickCount.toLocaleString()}회</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
