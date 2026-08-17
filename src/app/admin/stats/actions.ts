'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminAction } from '@/lib/supabase/adminAuth'

// orders.status 실제 체크 제약: pending/paid_escrow/confirmed/settled/disputed/refunded
// (buyer_id 구매확정·auto-settle cron 둘 다 paid_escrow → settled로 직행하고 'confirmed'를
// 실제로 쓰는 코드 경로는 없다). "결제 완료 후 환불되지 않은" 매출로 셀 상태만 매출에 포함.
const PAID_STATUSES = ['paid_escrow', 'settled']
// PostgREST 기본 응답 제한(1000행)에 걸리지 않도록 넉넉히 상한을 둔다.
const ORDER_FETCH_LIMIT = 5000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export interface AdminStatsSummary {
  revenue30d: number
  orderCount30d: number
  avgOrderAmount30d: number
  pendingSettlementCount: number
  dailyRevenue: { date: string; amount: number }[]
  byPaymentMethod: { method: string; count: number; amount: number }[]
  byStatus: { status: string; count: number }[]
  topDreams: { dreamId: number; title: string; salesCount: number; revenue: number }[]
  topDictionary: { slug: string; keyword: string; viewCount: number }[]
  topProducts: { title: string; clickCount: number }[]
  error?: string
}

function emptySummary(): AdminStatsSummary {
  return {
    revenue30d: 0,
    orderCount30d: 0,
    avgOrderAmount30d: 0,
    pendingSettlementCount: 0,
    dailyRevenue: [],
    byPaymentMethod: [],
    byStatus: [],
    topDreams: [],
    topDictionary: [],
    topProducts: [],
  }
}

export async function getAdminStatsSummary(): Promise<AdminStatsSummary> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { ...emptySummary(), error: auth.error }

  const admin = createAdminClient()

  const [ordersRes, dictRes, productsRes] = await Promise.all([
    admin
      .from('orders')
      .select('dream_id, amount, status, payment_method, paid_at')
      .order('paid_at', { ascending: false })
      .limit(ORDER_FETCH_LIMIT),
    admin
      .from('dictionary_entries')
      .select('slug, keyword, view_count')
      .order('view_count', { ascending: false })
      .limit(10),
    admin
      .from('affiliate_products')
      .select('title, click_count')
      .order('click_count', { ascending: false })
      .limit(10),
  ])

  const orders = ordersRes.data ?? []
  const now = Date.now()
  const cutoff = now - THIRTY_DAYS_MS

  const paidOrders = orders.filter((o) => PAID_STATUSES.includes(o.status))
  const recentPaidOrders = paidOrders.filter((o) => new Date(o.paid_at).getTime() >= cutoff)

  const revenue30d = recentPaidOrders.reduce((sum, o) => sum + o.amount, 0)
  const orderCount30d = recentPaidOrders.length
  const avgOrderAmount30d = orderCount30d > 0 ? Math.round(revenue30d / orderCount30d) : 0
  const pendingSettlementCount = orders.filter((o) => o.status === 'paid_escrow').length

  // 최근 30일 일자별 매출 — 거래 없는 날도 0으로 채워 차트가 끊기지 않게 한다.
  const dailyMap = new Map<string, number>()
  for (const o of recentPaidOrders) {
    const day = o.paid_at.slice(0, 10)
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + o.amount)
  }
  const dailyRevenue: AdminStatsSummary['dailyRevenue'] = []
  for (let i = 29; i >= 0; i--) {
    const key = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    dailyRevenue.push({ date: key, amount: dailyMap.get(key) ?? 0 })
  }

  // 결제수단별 비중 (전체 기간, 결제완료 주문 기준)
  const methodMap = new Map<string, { count: number; amount: number }>()
  for (const o of paidOrders) {
    const key = o.payment_method || '기타'
    const cur = methodMap.get(key) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += o.amount
    methodMap.set(key, cur)
  }
  const byPaymentMethod = Array.from(methodMap.entries())
    .map(([method, v]) => ({ method, ...v }))
    .sort((a, b) => b.amount - a.amount)

  // 주문 상태별 현황 (전체 기간)
  const statusMap = new Map<string, number>()
  for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1)
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

  // 인기 판매 꿈 TOP10 (전체 기간, 결제완료 주문 기준 — 판매건수 우선, 매출 동률 처리)
  const dreamMap = new Map<number, { salesCount: number; revenue: number }>()
  for (const o of paidOrders) {
    const cur = dreamMap.get(o.dream_id) ?? { salesCount: 0, revenue: 0 }
    cur.salesCount += 1
    cur.revenue += o.amount
    dreamMap.set(o.dream_id, cur)
  }
  const topDreamIds = Array.from(dreamMap.entries())
    .sort((a, b) => b[1].salesCount - a[1].salesCount || b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([dreamId]) => dreamId)

  let topDreams: AdminStatsSummary['topDreams'] = []
  if (topDreamIds.length > 0) {
    const { data: dreamRows } = await admin.from('dreams').select('id, title').in('id', topDreamIds)
    const titleMap = new Map((dreamRows ?? []).map((d) => [d.id as number, d.title as string]))
    topDreams = topDreamIds.map((id) => ({
      dreamId: id,
      title: titleMap.get(id) ?? '(삭제된 꿈)',
      salesCount: dreamMap.get(id)!.salesCount,
      revenue: dreamMap.get(id)!.revenue,
    }))
  }

  const topDictionary = (dictRes.data ?? []).map((d) => ({
    slug: d.slug as string,
    keyword: d.keyword as string,
    viewCount: (d.view_count as number | null) ?? 0,
  }))
  const topProducts = (productsRes.data ?? []).map((p) => ({
    title: p.title as string,
    clickCount: (p.click_count as number | null) ?? 0,
  }))

  return {
    revenue30d,
    orderCount30d,
    avgOrderAmount30d,
    pendingSettlementCount,
    dailyRevenue,
    byPaymentMethod,
    byStatus,
    topDreams,
    topDictionary,
    topProducts,
  }
}
