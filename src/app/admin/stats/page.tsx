'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { getAdminStatsSummary, getAdminPeriodStats, type AdminStatsSummary, type PeriodStats } from './actions'

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
  '#E5421F',
  '#231C17',
  '#FFD23F',
  '#1B4DB3',
  '#0B6A36',
]

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 sm:p-6">
      <p className="text-sm text-[#6B605A]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#231C17] sm:text-3xl">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="font-semibold text-[#231C17]">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

const kstToday = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)
const shiftDay = (d: string, n: number) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10)

const SERIES = [
  { key: 'visits', label: '방문', color: '#1B4DB3' },
  { key: 'signups', label: '가입', color: '#0B6A36' },
  { key: 'dreams', label: '꿈 등록', color: '#FFD23F' },
  { key: 'orders', label: '거래', color: '#231C17' },
  { key: 'revenue', label: '매출(원)', color: '#E5421F' },
] as const

function PeriodSection() {
  const [from, setFrom] = useState(() => shiftDay(kstToday(), -6))
  const [to, setTo] = useState(kstToday)
  const [data, setData] = useState<PeriodStats | null>(null)
  const [busy, setBusy] = useState(false)
  const [on, setOn] = useState<Record<string, boolean>>({ visits: true, signups: true, dreams: true, orders: true, revenue: true })

  async function run(f = from, t = to) {
    setBusy(true)
    setData(await getAdminPeriodStats(f, t))
    setBusy(false)
  }
  useEffect(() => { run() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  function preset(days: number) {
    const t = kstToday(); const f = shiftDay(t, -(days - 1))
    setFrom(f); setTo(t); run(f, t)
  }

  const rows = data?.rows ?? []
  return (
    <div className="mb-10 rounded border border-gray-200 bg-white">
      <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
        <h2 className="mr-auto text-lg font-bold text-[#231C17]">기간별 조회</h2>
        <div className="flex flex-wrap gap-1.5">
          {[['오늘', 1], ['7일', 7], ['30일', 30], ['90일', 90]].map(([l, n]) => (
            <button key={l as string} type="button" onClick={() => preset(n as number)} className="rounded-[3px] border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#6B605A] hover:border-[#231C17] hover:text-[#231C17]">{l}</button>
          ))}
        </div>
        <label className="text-xs text-[#6B605A]">시작일
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-[3px] border border-gray-300 px-2 py-1.5 text-sm text-[#231C17]" />
        </label>
        <label className="text-xs text-[#6B605A]">종료일
          <input type="date" value={to} min={from} max={kstToday()} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-[3px] border border-gray-300 px-2 py-1.5 text-sm text-[#231C17]" />
        </label>
        <button type="button" disabled={busy} onClick={() => run()} className="rounded-[3px] bg-[#E5421F] px-5 py-2 text-sm font-bold text-white hover:bg-[#C23A18] disabled:opacity-60">{busy ? '조회 중...' : '조회'}</button>
      </div>

      {data?.error && <p className="px-6 py-4 text-sm text-red-600">{data.error}</p>}

      {data && !data.error && (
        <div className="p-4 sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {SERIES.map((sr) => (
              <button key={sr.key} type="button" onClick={() => setOn((p) => ({ ...p, [sr.key]: !p[sr.key] }))}
                className={`rounded-[4px] border p-3 text-left transition-opacity ${on[sr.key] ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50 opacity-50'}`}>
                <span className="flex items-center gap-1.5 text-xs text-[#6B605A]"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: sr.color }} />{sr.label}</span>
                <strong className="mt-1 block text-xl text-[#231C17]">{data.totals[sr.key].toLocaleString()}{sr.key === 'revenue' ? '원' : ''}</strong>
              </button>
            ))}
          </div>
          {!data.visitsReady && <p className="mb-3 text-xs text-[#6B605A]">방문 기록 저장소가 아직 준비되지 않아 방문은 0으로 표시돼요. (SQL 1회 실행 필요)</p>}

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EADFD8" />
              <XAxis dataKey="date" tickFormatter={formatMonthDay} tick={{ fontSize: 12, fill: '#6B605A' }} minTickGap={16} />
              <YAxis yAxisId="cnt" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B605A' }} />
              <YAxis yAxisId="rev" orientation="right" tick={{ fontSize: 12, fill: '#6B605A' }} tickFormatter={(v) => Number(v).toLocaleString()} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {SERIES.filter((sr) => on[sr.key] && sr.key === 'revenue').map((sr) => (
                <Bar key={sr.key} yAxisId="rev" dataKey={sr.key} name={sr.label} fill={sr.color} fillOpacity={0.35} />
              ))}
              {SERIES.filter((sr) => on[sr.key] && sr.key !== 'revenue').map((sr) => (
                <Line key={sr.key} yAxisId="cnt" type="monotone" dataKey={sr.key} name={sr.label} stroke={sr.color} strokeWidth={2} dot={rows.length <= 31} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-6 max-h-[420px] overflow-auto border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200 text-right text-xs text-[#9A8F88]">
                  <th className="px-4 py-2.5 text-left">일자</th>
                  {SERIES.map((sr) => <th key={sr.key} className="px-4 py-2.5">{sr.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-right">
                {[...rows].reverse().map((r) => (
                  <tr key={r.date} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-left text-[#3A322C]">{r.date}</td>
                    <td className="px-4 py-2 text-[#6B605A]">{r.visits.toLocaleString()}</td>
                    <td className="px-4 py-2 text-[#6B605A]">{r.signups.toLocaleString()}</td>
                    <td className="px-4 py-2 text-[#6B605A]">{r.dreams.toLocaleString()}</td>
                    <td className="px-4 py-2 text-[#6B605A]">{r.orders.toLocaleString()}</td>
                    <td className="px-4 py-2 text-[#C23A18]">{r.revenue.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-50 font-bold">
                <tr className="border-t border-gray-200 text-right">
                  <td className="px-4 py-2.5 text-left text-[#231C17]">합계</td>
                  <td className="px-4 py-2.5">{data.totals.visits.toLocaleString()}</td>
                  <td className="px-4 py-2.5">{data.totals.signups.toLocaleString()}</td>
                  <td className="px-4 py-2.5">{data.totals.dreams.toLocaleString()}</td>
                  <td className="px-4 py-2.5">{data.totals.orders.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-[#C23A18]">{data.totals.revenue.toLocaleString()}원</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
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

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-[#9A8F88]">불러오는 중...</div>
  if (!stats) return null

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-[#231C17] sm:mb-8 sm:text-2xl">통계</h1>

      <PeriodSection />

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
              <div className="py-10 text-center text-sm text-[#9A8F88]">최근 30일간 매출 데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stats.dailyRevenue} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EADFD8" />
                  <XAxis dataKey="date" tickFormatter={formatMonthDay} tick={{ fontSize: 12, fill: '#6B605A' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B605A' }} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`, '매출']} />
                  <Line type="monotone" dataKey="amount" stroke="#E5421F" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* 결제수단별 비중 */}
        <Panel title="결제수단별 비중">
          {stats.byPaymentMethod.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#9A8F88]">데이터가 없습니다</div>
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
                  wrapperStyle={{ fontSize: 12, color: '#6B605A' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* 주문 상태별 현황 */}
        <Panel title="주문 상태별 현황">
          {stats.byStatus.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#9A8F88]">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.byStatus} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EADFD8" />
                <XAxis
                  dataKey="status"
                  tickFormatter={(v) => STATUS_LABELS[v] ?? v}
                  tick={{ fontSize: 12, fill: '#6B605A' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B605A' }} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}건`, '건수']}
                  labelFormatter={(label) => STATUS_LABELS[label as string] ?? label}
                />
                <Bar dataKey="count" fill="#E5421F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 인기 판매 꿈 TOP10 */}
        <Panel title="인기 판매 꿈 TOP 10">
          {stats.topDreams.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#9A8F88]">데이터가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-[#9A8F88]">
                    <th className="py-2 pr-3">꿈 제목</th>
                    <th className="py-2 pr-3">판매건수</th>
                    <th className="py-2">매출합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topDreams.map((d) => (
                    <tr key={d.dreamId}>
                      <td className="max-w-[160px] truncate py-2 pr-3">
                        <Link href={`/dream/${d.dreamId}`} className="text-[#3A322C] hover:text-brand-primary hover:underline">
                          {d.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-[#6B605A]">{d.salesCount.toLocaleString()}건</td>
                      <td className="py-2 text-[#C23A18]">{d.revenue.toLocaleString()}원</td>
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
            <div className="py-6 text-center text-sm text-[#9A8F88]">데이터가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-[#9A8F88]">
                    <th className="py-2 pr-3">표제어</th>
                    <th className="py-2">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topDictionary.map((d) => (
                    <tr key={d.slug}>
                      <td className="max-w-[160px] truncate py-2 pr-3">
                        <Link href={`/dictionary/${d.slug}`} className="text-[#3A322C] hover:text-brand-primary hover:underline">
                          {d.keyword}
                        </Link>
                      </td>
                      <td className="py-2 text-[#6B605A]">{d.viewCount.toLocaleString()}회</td>
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
            <div className="py-6 text-center text-sm text-[#9A8F88]">데이터가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-[#9A8F88]">
                    <th className="py-2 pr-3">상품명</th>
                    <th className="py-2">클릭수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topProducts.map((p, i) => (
                    <tr key={`${p.title}-${i}`}>
                      <td className="max-w-[160px] truncate py-2 pr-3 text-[#3A322C]">{p.title}</td>
                      <td className="py-2 text-[#6B605A]">{p.clickCount.toLocaleString()}회</td>
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
