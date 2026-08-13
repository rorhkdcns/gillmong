'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminAction } from '@/lib/supabase/adminAuth'
import { searchProducts } from '@/lib/coupang'
import { keywordToSlug } from '@/lib/slugify'
import { romanize } from '@/lib/romanize'
import { SAFETY_SETTINGS, isBlockedResponse } from '@/lib/contentFilter'
import { suggestTagsFromTitle } from '@/lib/autoTagProduct'

// 카테고리는 여러 페이지(메인/카테고리/사전)가 getActiveCategories() 캐시를 공유해서 쓰므로
// 태그 무효화 + 그 캐시를 쓰는 ISR 페이지들의 경로 무효화를 함께 해줘야 즉시 반영된다.
function revalidateCategoryPages() {
  revalidateTag('categories', 'max')
  revalidatePath('/')
  revalidatePath('/category/[slug]', 'page')
  revalidatePath('/dictionary')
  revalidatePath('/dictionary/[category]', 'page')
  revalidatePath('/dictionary/[category]/[sub]', 'page')
}

function revalidateDictionaryPages() {
  revalidatePath('/dictionary')
  revalidatePath('/dictionary/[category]', 'page')
  revalidatePath('/dictionary/[category]/[sub]', 'page')
}

function revalidateNoticePages() {
  revalidatePath('/notice')
  revalidatePath('/notice/[id]', 'page')
}

export async function syncSalePoints(): Promise<{
  success?: boolean
  synced?: number
  soldFixed?: number
  error?: string
}> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()

  // purchases 전체 조회 (dream 정보 포함)
  const { data: purchases, error: purchasesErr } = await admin
    .from('purchases')
    .select('id, price, dream_id, dreams(id, title, user_id, is_sold)')

  if (purchasesErr || !purchases) return { error: purchasesErr?.message ?? '구매 내역 조회 실패' }

  // 기존 earn 로그 목록 — 중복 지급 방지
  const { data: earnLogs } = await admin
    .from('point_logs')
    .select('user_id, description')
    .eq('type', 'earn')

  const credited = new Set(
    (earnLogs ?? []).map((l) => `${l.user_id}::${l.description}`)
  )

  let synced = 0
  let soldFixed = 0

  for (const purchase of purchases) {
    const dream = purchase.dreams as unknown as {
      id: number; title: string; user_id: string; is_sold: boolean
    } | null
    if (!dream) continue

    // is_sold 미설정 수정
    if (!dream.is_sold) {
      await admin.from('dreams').update({ is_sold: true }).eq('id', dream.id)
      soldFixed++
    }

    const sellerEarning = Math.floor(purchase.price * 0.8)
    const description = `꿈 판매 수익 — ${dream.title}`
    const key = `${dream.user_id}::${description}`

    // 이미 지급된 경우 건너뜀
    if (credited.has(key)) continue

    const { data: seller } = await admin
      .from('profiles')
      .select('points')
      .eq('id', dream.user_id)
      .single()

    if (!seller) continue

    await admin
      .from('profiles')
      .update({ points: seller.points + sellerEarning })
      .eq('id', dream.user_id)

    await admin.from('point_logs').insert({
      user_id: dream.user_id,
      amount: sellerEarning,
      type: 'earn',
      description,
    })

    credited.add(key)
    synced++
  }

  return { success: true, synced, soldFixed }
}

export async function resetAllData(): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()

  const { error: e1 } = await admin.from('point_logs').delete().neq('id', 0)
  if (e1) return { error: `point_logs 삭제 실패: ${e1.message}` }

  const { error: e2 } = await admin.from('purchases').delete().neq('id', 0)
  if (e2) return { error: `purchases 삭제 실패: ${e2.message}` }

  const { error: e3 } = await admin.from('dreams').delete().neq('id', 0)
  if (e3) return { error: `dreams 삭제 실패: ${e3.message}` }

  const { error: e4 } = await admin.from('profiles').update({ points: 0 }).not('id', 'is', null)
  if (e4) return { error: `포인트 초기화 실패: ${e4.message}` }

  return { success: true }
}

// ── 대시보드 통계 ─────────────────────────────────────────────
export async function getAdminStats() {
  const auth = await requireAdminAction()
  if (!auth.ok) {
    return {
      totalUsers: 0, totalDreams: 0, totalTransactions: 0, totalPoints: 0,
      recentUsers: [] as unknown[], recentTx: [] as unknown[],
    }
  }

  const admin = createAdminClient()
  const [profilesRes, dreamsRes, purchasesRes, pointsRes, recentUsersRes, recentTxRes] =
    await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('dreams').select('*', { count: 'exact', head: true }),
      admin.from('purchases').select('*', { count: 'exact', head: true }),
      admin.from('point_logs').select('amount').eq('type', 'charge'),
      admin.from('profiles').select('id, nickname, username, points, created_at').order('created_at', { ascending: false }).limit(5),
      admin.from('purchases').select('id, price, created_at, dreams(title), profiles!buyer_id(nickname, username)').order('created_at', { ascending: false }).limit(5),
    ])
  const totalPoints = (pointsRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  return {
    totalUsers:        profilesRes.count ?? 0,
    totalDreams:       dreamsRes.count ?? 0,
    totalTransactions: purchasesRes.count ?? 0,
    totalPoints,
    recentUsers:  recentUsersRes.data ?? [],
    recentTx:     (recentTxRes.data ?? []) as unknown[],
  }
}

// ── 회원 관리 ──────────────────────────────────────────────────
export async function getAdminUsers(search?: string): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  let q = admin.from('profiles').select('*').order('created_at', { ascending: false })
  if (search) q = q.or(`nickname.ilike.%${search}%,username.ilike.%${search}%`)
  const { data, error } = await q
  if (error) {
    console.error('[Admin] getAdminUsers error:', error.message)
    return { data: [], error: error.message }
  }
  return { data: data ?? [] }
}

export async function adminAdjustPoints(
  userId: string, amount: number, description: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('points').eq('id', userId).single()
  if (!profile) return { error: '회원을 찾을 수 없습니다' }
  const newPoints = profile.points + amount
  if (newPoints < 0) return { error: '포인트가 부족합니다' }
  const { error: e1 } = await admin.from('profiles').update({ points: newPoints }).eq('id', userId)
  if (e1) return { error: e1.message }
  await admin.from('point_logs').insert({
    user_id: userId, amount,
    type: amount > 0 ? 'charge' : 'use',
    description: description || (amount > 0 ? '관리자 포인트 지급' : '관리자 포인트 차감'),
  })
  return { success: true }
}

export async function adminAdjustPointsByUsername(
  username: string, amount: number,
): Promise<{ success?: boolean; new_points?: number; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('id, points').eq('username', username).single()
  if (!profile) return { error: '존재하지 않는 아이디입니다.' }
  const newPoints = profile.points + amount
  if (newPoints < 0) return { error: `포인트가 부족합니다. (보유: ${profile.points.toLocaleString()}원)` }
  const { error: e1 } = await admin.from('profiles').update({ points: newPoints }).eq('id', profile.id)
  if (e1) return { error: e1.message }
  await admin.from('point_logs').insert({
    user_id: profile.id, amount,
    type: amount > 0 ? 'charge' : 'use',
    description: amount > 0 ? '관리자 포인트 지급' : '관리자 포인트 차감',
  })
  return { success: true, new_points: newPoints }
}

export async function adminSendPasswordReset(
  userId: string,
): Promise<{ success?: boolean; link?: string; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: authUser, error } = await admin.auth.admin.getUserById(userId)
  if (error || !authUser.user?.email) return { error: '사용자 이메일을 찾을 수 없습니다' }
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.user.email,
  })
  if (linkErr) return { error: linkErr.message }
  return { success: true, link: linkData.properties?.action_link }
}

export async function adminDeleteUser(
  userId: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()

  // 1. 보조 테이블 삭제 (테이블 미존재 등 에러가 나도 계속 진행)
  const auxResults = await Promise.all([
    admin.from('withdrawal_requests').delete().eq('user_id', userId),
    admin.from('reports').delete().eq('reporter_id', userId),
    admin.from('analysis_logs').delete().eq('user_id', userId),
    admin.from('saved_dreams').delete().eq('user_id', userId),
    admin.from('inquiries').delete().eq('user_id', userId),
  ])
  auxResults.forEach(({ error }, i) => {
    if (error) console.warn(`[adminDeleteUser] aux[${i}]:`, error.message)
  })

  // 5. point_logs 삭제
  const { error: ep } = await admin.from('point_logs').delete().eq('user_id', userId)
  if (ep) { console.error('[adminDeleteUser] point_logs:', ep.message); return { error: `point_logs 삭제 실패: ${ep.message}` } }

  // 6. 이 유저가 구매한 꿈 → 판매 취소 처리
  const { data: boughtDreams } = await admin.from('purchases').select('dream_id').eq('buyer_id', userId)
  for (const p of boughtDreams ?? []) {
    await admin.from('dreams').update({ is_sold: false }).eq('id', p.dream_id)
  }

  // 7. 이 유저의 구매 기록 삭제
  const { error: epu } = await admin.from('purchases').delete().eq('buyer_id', userId)
  if (epu) { console.error('[adminDeleteUser] purchases:', epu.message); return { error: `purchases 삭제 실패: ${epu.message}` } }

  // 8. 이 유저의 꿈 삭제 (→ 연결된 purchases·reports 캐스케이드)
  const { error: ed } = await admin.from('dreams').delete().eq('user_id', userId)
  if (ed) { console.error('[adminDeleteUser] dreams:', ed.message); return { error: `dreams 삭제 실패: ${ed.message}` } }

  // 9. 프로필 삭제
  const { error: epr } = await admin.from('profiles').delete().eq('id', userId)
  if (epr) { console.error('[adminDeleteUser] profiles:', epr.message); return { error: `profiles 삭제 실패: ${epr.message}` } }

  // 10. Auth 유저 삭제
  const { error: eauth } = await admin.auth.admin.deleteUser(userId)
  if (eauth) { console.error('[adminDeleteUser] auth.deleteUser:', eauth.message); return { error: eauth.message } }

  return { success: true }
}

// ── 사업자회원 승인 ────────────────────────────────────────────
export async function getBusinessApplications(
  status?: string,
): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  let q = admin
    .from('profiles')
    .select('id, username, nickname, real_name, phone, email, business_name, business_number, representative_name, verification_status, verified_at, created_at')
    .eq('member_type', 'business')
    .order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('verification_status', status)
  const { data, error } = await q
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function adminHandleBusinessApproval(
  userId: string,
  action: 'approve' | 'reject',
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const patch: Record<string, unknown> = {
    verification_status: action === 'approve' ? 'approved' : 'rejected',
  }
  if (action === 'approve') patch.verified_at = new Date().toISOString()
  const { error } = await admin.from('profiles').update(patch).eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 꿈 관리 ───────────────────────────────────────────────────
export async function getAdminDreams(category?: string, isSold?: string): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  let q = admin.from('dreams')
    .select('id, title, grade, category, price, is_sold, created_at, user_id')
    .order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  if (isSold === 'true')  q = q.eq('is_sold', true)
  if (isSold === 'false') q = q.eq('is_sold', false)
  const { data: dreams, error } = await q
  if (error) {
    console.error('[Admin] getAdminDreams error:', error.message)
    return { data: [], error: error.message }
  }
  if (!dreams || dreams.length === 0) return { data: [] }

  const dreamIds = dreams.map((d) => d.id)
  const userIds  = [...new Set(dreams.map((d) => d.user_id).filter(Boolean))]

  const [{ data: profileRows }, { data: reportRows }] = await Promise.all([
    admin.from('profiles').select('id, nickname, username').in('id', userIds),
    admin.from('reports').select('dream_id, status').in('dream_id', dreamIds),
  ])

  const profileMap: Record<string, { nickname: string; username: string }> = {}
  for (const p of profileRows ?? []) {
    profileMap[p.id] = { nickname: p.nickname, username: p.username }
  }

  const reportCountMap: Record<number, number> = {}
  const pendingCountMap: Record<number, number> = {}
  for (const r of reportRows ?? []) {
    reportCountMap[r.dream_id] = (reportCountMap[r.dream_id] ?? 0) + 1
    if (r.status === 'pending') pendingCountMap[r.dream_id] = (pendingCountMap[r.dream_id] ?? 0) + 1
  }

  return {
    data: dreams.map((d) => ({
      id: d.id,
      title: d.title,
      grade: d.grade,
      category: d.category,
      price: d.price,
      is_sold: d.is_sold,
      created_at: d.created_at,
      profiles: profileMap[d.user_id] ?? null,
      report_count: reportCountMap[d.id] ?? 0,
      pending_report_count: pendingCountMap[d.id] ?? 0,
    })),
  }
}

export async function getAdminDreamDetail(dreamId: number): Promise<{ data?: unknown; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()

  const { data: dream, error } = await admin
    .from('dreams')
    .select('id, title, grade, category, price, is_sold, created_at, user_id, content, summary, interpretation, advice, reconstructed_dream')
    .eq('id', dreamId)
    .single()
  if (error || !dream) return { error: error?.message ?? '꿈을 찾을 수 없습니다.' }

  const [
    { data: seller },
    { data: purchases },
    { data: reports },
  ] = await Promise.all([
    admin.from('profiles').select('nickname, username').eq('id', dream.user_id).single(),
    admin.from('purchases').select('id, price, buyer_id, created_at').eq('dream_id', dreamId),
    admin.from('reports').select('id, reason, detail, status, created_at, reporter_id').eq('dream_id', dreamId).order('created_at', { ascending: false }),
  ])

  const buyerIds    = [...new Set((purchases ?? []).map((p) => p.buyer_id))]
  const reporterIds = [...new Set((reports ?? []).map((r) => r.reporter_id))]
  const allIds      = [...new Set([...buyerIds, ...reporterIds])]

  const { data: profileRows } = allIds.length
    ? await admin.from('profiles').select('id, nickname, username').in('id', allIds)
    : { data: [] }

  const profileMap: Record<string, { nickname: string; username: string }> = {}
  for (const p of profileRows ?? []) profileMap[p.id] = { nickname: p.nickname, username: p.username }

  return {
    data: {
      ...dream,
      seller: seller ?? null,
      buyers: (purchases ?? []).map((p) => ({
        ...p,
        profile: profileMap[p.buyer_id] ?? null,
      })),
      reports: (reports ?? []).map((r) => ({
        ...r,
        reporter: profileMap[r.reporter_id] ?? null,
      })),
    },
  }
}

export async function adminDeleteDreamById(
  dreamId: number,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  await admin.from('point_logs').delete().like('description', `%${dreamId}%`)
  await admin.from('purchases').delete().eq('dream_id', dreamId)
  const { error } = await admin.from('dreams').delete().eq('id', dreamId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 거래 내역 ──────────────────────────────────────────────────
export async function getAdminTransactions(): Promise<unknown[]> {
  const auth = await requireAdminAction()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('purchases')
    .select('id, price, created_at, dreams(id, title, grade), profiles!buyer_id(nickname, username)')
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown[]
}

// ── 공지사항 ───────────────────────────────────────────────────
export async function getAdminNotices() {
  const auth = await requireAdminAction()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('notices')
    .select('id, title, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createAdminNotice(
  title: string, content: string, isPinned: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('notices').insert({ title, content, is_pinned: isPinned })
  if (error) return { error: error.message }
  revalidateNoticePages()
  return { success: true }
}

export async function deleteAdminNotice(id: number): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('notices').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateNoticePages()
  return { success: true }
}

export async function getAdminNoticeById(id: number): Promise<{ id: number; title: string; content: string; is_pinned: boolean } | null> {
  const auth = await requireAdminAction()
  if (!auth.ok) return null

  const admin = createAdminClient()
  const { data } = await admin.from('notices').select('id, title, content, is_pinned').eq('id', id).single()
  return data ?? null
}

export async function updateAdminNotice(
  id: number, title: string, content: string, isPinned: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('notices').update({ title, content, is_pinned: isPinned }).eq('id', id)
  if (error) return { error: error.message }
  revalidateNoticePages()
  return { success: true }
}

// ── 1:1 문의 ───────────────────────────────────────────────────
export async function getAdminInquiries() {
  const auth = await requireAdminAction()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data: inquiries } = await admin
    .from('inquiries')
    .select('id, title, content, status, answer, created_at, answered_at, user_id')
    .order('created_at', { ascending: false })

  if (!inquiries || inquiries.length === 0) return []

  const userIds = [...new Set(inquiries.map((i) => i.user_id).filter(Boolean))]
  const { data: profiles } = await admin.from('profiles').select('id, nickname, username').in('id', userIds)
  const profileMap: Record<string, { nickname: string; username: string }> = {}
  for (const p of profiles ?? []) profileMap[p.id] = { nickname: p.nickname, username: p.username }

  return inquiries.map((i) => ({ ...i, profiles: profileMap[i.user_id] ?? null }))
}

export async function adminAnswerInquiry(
  id: number, answer: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('inquiries').update({
    answer,
    status: 'answered',
    answered_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 대시보드용 대기 중 출금신청 ───────────────────────────────────
export async function getPendingWithdrawals() {
  const auth = await requireAdminAction()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data: withdrawals, error } = await admin
    .from('withdrawal_requests')
    .select('id, user_id, amount, bank_name, account_holder, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error || !withdrawals || withdrawals.length === 0) return []

  const userIds = [...new Set(withdrawals.map((w) => w.user_id).filter(Boolean))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname, username')
    .in('id', userIds)

  const profileMap: Record<string, { nickname: string; username: string }> = {}
  for (const p of profiles ?? []) profileMap[p.id] = { nickname: p.nickname, username: p.username }

  return withdrawals.map((w) => ({ ...w, profiles: profileMap[w.user_id] ?? null }))
}

// ── 대시보드용 대기 중 제휴문의 ───────────────────────────────────
export async function getPendingPartnerships() {
  const auth = await requireAdminAction()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partnership_inquiries')
    .select('id, name, company, title, status, created_at')
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) return []
  return data ?? []
}

// ── 출금 신청 ──────────────────────────────────────────────────
export async function getAdminWithdrawals() {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error, data: [] }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { error: error.message, data: [] }
  return { data: data ?? [] }
}

export async function adminHandleWithdrawal(
  id: number, action: 'approve' | 'reject',
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('withdrawal_requests')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 에스크로 주문 관리 ─────────────────────────────────────────
export async function getAdminOrders(status: string): Promise<unknown[]> {
  const auth = await requireAdminAction()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('id, buyer_id, seller_id, dream_id, amount, seller_amount, payment_method, status, paid_at, confirm_deadline, dispute_reason, settled_at')
    .eq('status', status)
    .order('paid_at', { ascending: false })

  if (!orders || orders.length === 0) return []

  const buyerIds  = [...new Set(orders.map((o) => o.buyer_id))]
  const sellerIds = [...new Set(orders.map((o) => o.seller_id))]
  const dreamIds  = [...new Set(orders.map((o) => o.dream_id))]
  const allUserIds = [...new Set([...buyerIds, ...sellerIds])]

  const [{ data: profileRows }, { data: dreamRows }] = await Promise.all([
    admin.from('profiles').select('id, nickname, username').in('id', allUserIds),
    admin.from('dreams').select('id, title').in('id', dreamIds),
  ])

  const profileMap: Record<string, { nickname: string; username: string }> = {}
  for (const p of profileRows ?? []) profileMap[p.id] = { nickname: p.nickname, username: p.username }

  const dreamMap: Record<number, string> = {}
  for (const d of dreamRows ?? []) dreamMap[d.id] = d.title

  return orders.map((o) => ({
    ...o,
    buyer_profile:  profileMap[o.buyer_id]  ?? null,
    seller_profile: profileMap[o.seller_id] ?? null,
    dream_title:    dreamMap[o.dream_id]    ?? null,
  }))
}

export async function adminSettleOrder(
  orderId: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id, seller_id, seller_amount, status')
    .eq('id', orderId)
    .single()

  if (!order) return { error: '주문을 찾을 수 없습니다' }
  if (order.status === 'settled') return { success: true }

  const now = new Date().toISOString()
  const { data: sellerProfile } = await admin
    .from('profiles')
    .select('points')
    .eq('id', order.seller_id)
    .single()

  await Promise.all([
    admin.from('orders').update({
      status:       'settled',
      confirmed_at: now,
      settled_at:   now,
      updated_at:   now,
    }).eq('id', orderId),
    ...(sellerProfile ? [
      admin.from('profiles')
        .update({ points: sellerProfile.points + order.seller_amount })
        .eq('id', order.seller_id),
      admin.from('point_logs').insert({
        user_id:     order.seller_id,
        amount:      order.seller_amount,
        type:        'earn',
        description: `꿈 판매 정산 (관리자 처리, 주문 ${orderId.substring(0, 8)}...)`,
      }),
    ] : []),
  ])
  return { success: true }
}

export async function adminRefundOrder(
  orderId: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('id, buyer_id, dream_id, amount, nicepay_tid, status')
    .eq('id', orderId)
    .single()

  if (!order) return { error: '주문을 찾을 수 없습니다' }
  if (order.status === 'refunded') return { success: true }

  const now = new Date().toISOString()

  await Promise.all([
    admin.from('orders').update({ status: 'refunded', updated_at: now }).eq('id', orderId),
    // 구매 기록 삭제 (열람 권한 회수)
    admin.from('purchases').delete().eq('buyer_id', order.buyer_id).eq('dream_id', order.dream_id),
    // 꿈 판매완료 해제
    admin.from('dreams').update({ is_sold: false }).eq('id', order.dream_id),
  ])

  return { success: true }
}

// ── 카테고리 관리 ───────────────────────────────────────────────
export interface AdminCategoryFields {
  name: string
  slug: string
  domain: 'dream' | 'shop'
  parentId: string | null
  imageUrl: string | null
}

export async function createAdminCategory(
  fields: AdminCategoryFields, sortOrder: number,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('categories').insert({
    name: fields.name,
    slug: fields.slug,
    domain: fields.domain,
    parent_id: fields.parentId,
    image_url: fields.imageUrl,
    sort_order: sortOrder,
    is_active: true,
  })
  if (error) return { error: error.message }
  revalidateCategoryPages()
  return { success: true }
}

export async function updateAdminCategory(
  id: string, fields: Omit<AdminCategoryFields, 'domain'>,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('categories').update({
    name: fields.name,
    slug: fields.slug,
    parent_id: fields.parentId,
    image_url: fields.imageUrl,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidateCategoryPages()
  return { success: true }
}

export async function uploadAdminCategoryImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: '파일이 없습니다.' }

  const admin = createAdminClient()
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `category_${Date.now()}.${ext}`

  const { error: uploadErr } = await admin.storage
    .from('categories')
    .upload(path, file, { upsert: true })
  if (uploadErr) return { error: uploadErr.message }

  const { data: { publicUrl } } = admin.storage.from('categories').getPublicUrl(path)
  return { url: publicUrl }
}

export async function toggleAdminCategoryActive(
  id: string, isActive: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('categories').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidateCategoryPages()
  return { success: true }
}

export async function reorderAdminCategories(
  idA: string, sortOrderA: number, idB: string, sortOrderB: number,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const [r1, r2] = await Promise.all([
    admin.from('categories').update({ sort_order: sortOrderA }).eq('id', idA),
    admin.from('categories').update({ sort_order: sortOrderB }).eq('id', idB),
  ])
  const error = r1.error ?? r2.error
  if (error) return { error: error.message }
  revalidateCategoryPages()
  return { success: true }
}

export async function deleteAdminCategory(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateCategoryPages()
  return { success: true }
}

// ── 해몽 사전 ──────────────────────────────────────────────────
export interface AdminDictionaryFields {
  slug: string
  keyword: string
  summary: string
  body: string
  categorySlug: string | null
  subcategorySlug: string | null
  tags: string[]
  isPublished: boolean
}

export async function getAdminDictionaryEntries(): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dictionary_entries')
    .select('id, slug, keyword, category_slug, is_published, view_count, updated_at')
    .order('updated_at', { ascending: false })
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function checkAdminDictionarySlugExists(
  slug: string, excludeId?: string,
): Promise<boolean> {
  const auth = await requireAdminAction()
  if (!auth.ok) return false

  const admin = createAdminClient()
  let q = admin.from('dictionary_entries').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const { data } = await q
  return (data?.length ?? 0) > 0
}

// 대분류 필터링용 — has_public_page/발행 글 개수와 무관하게 활성 소분류 전부 반환 (기타 소분류 포함)
export async function getAdminDictionarySubcategories(): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dictionary_subcategories')
    .select('slug, name, parent_slug, sort_order')
    .eq('is_active', true)
    .order('parent_slug', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function getAdminDictionaryEntryById(id: string): Promise<unknown | null> {
  const auth = await requireAdminAction()
  if (!auth.ok) return null

  const admin = createAdminClient()
  const { data } = await admin.from('dictionary_entries').select('*').eq('id', id).single()
  return data ?? null
}

export async function createAdminDictionaryEntry(
  fields: AdminDictionaryFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('dictionary_entries').insert({
    slug: fields.slug,
    keyword: fields.keyword,
    summary: fields.summary,
    body: fields.body,
    category_slug: fields.categorySlug,
    subcategory_slug: fields.subcategorySlug,
    tags: fields.tags,
    is_published: fields.isPublished,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }
  revalidateDictionaryPages()
  return { success: true }
}

export async function updateAdminDictionaryEntry(
  id: string, fields: AdminDictionaryFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('dictionary_entries').update({
    slug: fields.slug,
    keyword: fields.keyword,
    summary: fields.summary,
    body: fields.body,
    category_slug: fields.categorySlug,
    subcategory_slug: fields.subcategorySlug,
    tags: fields.tags,
    is_published: fields.isPublished,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidateDictionaryPages()
  return { success: true }
}

export async function deleteAdminDictionaryEntry(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('dictionary_entries').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateDictionaryPages()
  return { success: true }
}

// ── 사전 초안 자동 생성(구 generate_drafts.py 대체) ──────────────────────
// dictionary_headwords에서 미작성 표제어를 하나 골라 Gemini로 글을 쓰고
// dictionary_entries에 비공개(is_published: false) 초안으로 저장한다.
const DRAFT_GEMINI_MODEL = 'gemini-2.5-flash'
const DRAFT_GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${DRAFT_GEMINI_MODEL}:generateContent`
const BODY_MARKER = '===BODY==='

function buildDraftPrompt(headword: string, longtailKeywords: string[]): string {
  const longtailBlock = longtailKeywords.map((k) => `   - ${k}`).join('\n')
  return `한국 전통 꿈해몽 사전에 들어갈 글을 써줘. 표제어: "${headword}"

실제 검색되는 관련 키워드들이야. 이 중 자연스러운 것들을 "상황별 해석" 항목으로 다뤄줘.
전부 억지로 넣지 말고 뜻이 통하는 것만 골라도 돼:
${longtailBlock}

────────────────────────────────────
출력 형식 — 반드시 이 형식 그대로 지켜줘. HTML 태그, 마크다운(#, *, **) 절대 쓰지 마.

첫 줄에 한 줄 요약(길몽/흉몽/양면 여부, 1~2문장)만 쓰고,
그다음 줄에 정확히 "===BODY===" 라고만 쓰고,
그다음부터 아래 문법으로 본문을 써줘:

  [[소제목]]              -> 일반 섹션 시작
  [[!소제목]]             -> 주의/반전 섹션 시작 (예: 반대로 해석되는 경우)
  >라벨 | 설명            -> 항목 카드. 라벨은 5~15자 정도로 짧게, 설명은 한 줄에
                            이어서 쓰고 절대 줄바꿈하지 말 것 (한 항목 = 한 줄)
  빈 줄                   -> 문단/항목 구분

⚠️ 가장 중요한 규칙 — "상황별 해석" 항목은 절대로 라벨과 설명을 다른 줄에
나눠 쓰면 안 됨. 반드시 ">"로 시작해서 "|"로 라벨과 설명을 같은 줄에
이어 붙여야 함. 예시:

  나쁜 예 (절대 이렇게 쓰지 말 것):
  돼지꿈 태몽
  건강하고 총명한 아이를 낳을 길몽입니다.

  좋은 예 (반드시 이렇게):
  >돼지꿈 태몽 | 건강하고 총명한 아이를 낳을 길몽으로 해석됩니다.

"상황별 해석" 섹션 안의 모든 줄은 예외 없이 ">"로 시작해야 함.

본문 구성 순서:
[[기본 상징 의미]]
(3~4개 문단. 뱀/돼지 등 표제어가 전통적으로 어떤 의미를 갖는지)

[[상황별 해석]]
(위에서 고른 관련 키워드들을 ">라벨 | 설명" 카드 형식으로, 5~12개)

[[!반대로 해석되는 경우]]
(1~2개 문단. 같은 소재가 흉몽으로 뒤집히는 상황)

[[이런 꿈을 꿨다면]]
(1개 문단. 짧은 마무리 조언)

────────────────────────────────────
톤·분량 규칙:
- 단정하지 말고 "~라고 봅니다", "~로 해석되곤 합니다" 체
- 한자 표기 없이 순한글 위주
- 미신을 사실처럼 강요하지 말고 전통적 해석을 소개하는 톤
- 전체 분량 2000자 이상
- 표제어를 다시 언급하는 제목 줄("표제어: OO")을 절대 넣지 말 것 — 요약부터 바로 시작
- 안내 문구나 "알겠습니다" 같은 말 없이, 첫 줄부터 바로 요약 문장으로 시작`
}

/** "라벨" 줄 다음에 "설명" 줄이 따로 온 걸 ">라벨 | 설명" 한 줄로 합쳐주는 안전장치(Gemini가 형식을 안 지켰을 때 대비). */
function autoFixLabelDescPairs(body: string): string {
  const endsLikeSentence = (s: string) => /[다요음임함]$/.test(s)
  const lines = body.split('\n')
  const result: string[] = []
  let i = 0
  while (i < lines.length) {
    const cur  = lines[i].trim()
    const next = lines[i + 1]?.trim() ?? ''
    const looksLikeLabel = cur && !cur.startsWith('[[') && !cur.startsWith('>') && cur.length <= 20 && !endsLikeSentence(cur)
    const looksLikeDesc  = next && !next.startsWith('[[') && !next.startsWith('>') && endsLikeSentence(next)
    if (looksLikeLabel && looksLikeDesc) {
      result.push(`>${cur} | ${next}`)
      i += 2
    } else {
      result.push(lines[i])
      i += 1
    }
  }
  return result.join('\n')
}

/** 매핑에 없는 단어가 섞인 표제어의 slug 폴백. 로마자 변환 결과를 [a-z0-9-]만 남게 정리한다. */
function romanizeSlugFallback(headword: string): string {
  const raw = `${romanize(headword)}-dream`
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return cleaned || 'dream'
}

async function generateUniqueDictionarySlug(
  admin: ReturnType<typeof createAdminClient>, base: string,
): Promise<string> {
  let candidate = base
  let n = 2
  while (true) {
    const { data } = await admin.from('dictionary_entries').select('id').eq('slug', candidate).limit(1)
    if (!data || data.length === 0) return candidate
    candidate = `${base}-${n}`
    n++
  }
}

export async function generateDictionaryDraft(
  categorySlug?: string,
): Promise<{ headword?: string; slug?: string; bodyLength?: number; error?: string; skipped?: boolean }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }

  const admin = createAdminClient()

  // ── 1. 대상 표제어 선정 ──
  let headwordQuery = admin
    .from('dictionary_headwords')
    .select('id, headword, category_slug')
    .eq('status', '미작성')
    .order('tier', { ascending: true })
    .order('total_search_volume', { ascending: false })
    .limit(1)
  if (categorySlug) headwordQuery = headwordQuery.eq('category_slug', categorySlug)

  const { data: headwordRows, error: headwordErr } = await headwordQuery
  if (headwordErr) return { error: headwordErr.message }
  const target = headwordRows?.[0]
  if (!target) return { error: '생성할 표제어가 없습니다.' }

  // ── 1.5. 중복 확인 (로컬 generate_drafts.py가 이미 만들어둔 글일 수 있음) ──
  // 로컬 스크립트는 dictionary_headwords를 모르고 dictionary_entries에 직접 저장하므로,
  // status가 여전히 '미작성'인 표제어라도 실제로는 이미 글이 존재할 수 있다.
  const dedupeKeyword = target.headword.endsWith('꿈') ? target.headword : `${target.headword} 꿈`
  const { data: existingRows, error: existingErr } = await admin
    .from('dictionary_entries')
    .select('id')
    .eq('keyword', dedupeKeyword)
    .limit(1)
  if (existingErr) return { headword: target.headword, error: existingErr.message }
  if (existingRows && existingRows.length > 0) {
    await admin.from('dictionary_headwords').update({ status: '초안생성' }).eq('id', target.id)
    return { headword: target.headword, skipped: true }
  }

  const { data: longtailRows, error: longtailErr } = await admin
    .from('dictionary_longtails')
    .select('keyword, search_volume')
    .eq('headword_id', target.id)
    .order('search_volume', { ascending: false })
  if (longtailErr) return { headword: target.headword, error: longtailErr.message }
  const longtails = longtailRows ?? []

  // ── 2. keyword / slug 생성 ──
  const keyword = dedupeKeyword

  const slugResult = keywordToSlug(keyword)
  const baseSlug = (!slugResult.hasUnmatched && slugResult.slug)
    ? slugResult.slug
    : romanizeSlugFallback(target.headword)
  const finalSlug = await generateUniqueDictionarySlug(admin, baseSlug)

  // ── 3. Gemini 호출 ──
  const prompt = buildDraftPrompt(target.headword, longtails.map((l) => l.keyword))
  const reqBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.75 },
    safetySettings: SAFETY_SETTINGS,
  })

  let res: Response | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(`${DRAFT_GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: reqBody,
    })
    if (res.ok || (res.status !== 503 && res.status !== 529)) break
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!res || !res.ok) {
    const errText = await res?.text()
    console.error('[generateDictionaryDraft] Gemini API 오류', { status: res?.status, errText })
    return { headword: target.headword, error: `Gemini API 오류 (${res?.status ?? '알 수 없음'})` }
  }

  const geminiData = await res.json()
  if (isBlockedResponse(geminiData)) {
    console.error('[generateDictionaryDraft] Gemini 안전 차단', target.headword)
    return { headword: target.headword, error: '콘텐츠 생성이 차단되었습니다. (안전 필터)' }
  }

  const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // ── 4. 응답 파싱 + 자동 보정 ──
  const cleaned = rawText.trim()
    .replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()
    .replaceAll('**', '')

  let summary: string
  let body: string
  const markerIdx = cleaned.indexOf(BODY_MARKER)
  if (markerIdx === -1) {
    const lines = cleaned.split('\n')
    summary = (lines[0] ?? '').trim()
    body = lines.slice(1).join('\n').trim()
  } else {
    summary = cleaned.slice(0, markerIdx).trim()
    body = cleaned.slice(markerIdx + BODY_MARKER.length).trim()
  }
  body = autoFixLabelDescPairs(body)

  if (!summary || !body) return { headword: target.headword, error: 'Gemini 응답을 파싱하지 못했습니다.' }

  // ── 5. 저장 ──
  const tags = longtails.slice(0, 5).map((l) => l.keyword)

  const { error: insertErr } = await admin.from('dictionary_entries').insert({
    slug: finalSlug,
    keyword,
    summary,
    body,
    category_slug: target.category_slug,
    subcategory_slug: null,
    tags,
    is_published: false,
    updated_at: new Date().toISOString(),
  })
  if (insertErr) return { headword: target.headword, error: insertErr.message }

  await admin.from('dictionary_headwords').update({ status: '초안생성' }).eq('id', target.id)

  return { headword: target.headword, slug: finalSlug, bodyLength: body.length }
}

// ── 사전 초안 여러 개 순차 생성 ──────────────────────────────────────
// generateDictionaryDraft()를 표제어 하나가 남아있지 않을 때까지(또는 count에 도달할
// 때까지) 순차 반복 호출한다. 매번 "다음 우선순위 미작성 표제어"를 새로 조회해야 하므로
// 병렬화하지 않고, Gemini API 요청 제한을 피하려고 회차 사이에 짧은 딜레이를 둔다.
export interface DictionaryDraftBatchItem {
  headword: string
  slug?: string
  status: 'ok' | 'error'
  message?: string
}

export interface DictionaryDraftBatchResult {
  requested: number
  succeeded: number
  failed: number
  skipped: number
  results: DictionaryDraftBatchItem[]
  stoppedReason?: string
}

const DRAFT_BATCH_MAX_COUNT = 20
const DRAFT_BATCH_DELAY_MS = 1500
const NO_HEADWORD_LEFT_MESSAGE = '생성할 표제어가 없습니다.'
// 로컬 스크립트가 이미 처리해둔 표제어를 계속 건너뛰기만 하는 경우에도 무한루프에
// 빠지지 않도록, 실제 시도 횟수 상한을 count의 배수로 둔다.
const DRAFT_BATCH_MAX_ATTEMPT_MULTIPLIER = 3

export async function generateDictionaryDrafts(
  categorySlug?: string, count: number = 1,
): Promise<DictionaryDraftBatchResult> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { requested: 0, succeeded: 0, failed: 0, skipped: 0, results: [], stoppedReason: auth.error }

  const clampedCount = Math.min(DRAFT_BATCH_MAX_COUNT, Math.max(1, Math.trunc(count) || 1))
  const maxAttempts = clampedCount * DRAFT_BATCH_MAX_ATTEMPT_MULTIPLIER
  const results: DictionaryDraftBatchItem[] = []
  let skipped = 0
  let stoppedReason: string | undefined
  let attempts = 0

  while (results.length < clampedCount && attempts < maxAttempts) {
    if (attempts > 0) await new Promise((r) => setTimeout(r, DRAFT_BATCH_DELAY_MS))
    attempts++

    const result = await generateDictionaryDraft(categorySlug)

    if (result.skipped) {
      skipped++
      continue
    }

    if (result.error) {
      if (!result.headword && result.error === NO_HEADWORD_LEFT_MESSAGE) {
        stoppedReason = result.error
        break
      }
      results.push({ headword: result.headword ?? '(알 수 없음)', status: 'error', message: result.error })
      continue
    }

    results.push({ headword: result.headword!, slug: result.slug, status: 'ok' })
  }

  if (!stoppedReason && attempts >= maxAttempts && results.length < clampedCount) {
    stoppedReason = `이미 작성된 표제어를 건너뛰느라 최대 시도 횟수(${maxAttempts}회)에 도달하여 중단했습니다.`
  }

  return {
    requested: clampedCount,
    succeeded: results.filter((r) => r.status === 'ok').length,
    failed: results.filter((r) => r.status === 'error').length,
    skipped,
    results,
    stoppedReason,
  }
}

// ── 제휴 상품 ──────────────────────────────────────────────────
export interface AdminAffiliateFields {
  title: string
  priceText: string | null
  imageUrl: string | null
  linkUrl: string
  tags: string[]
  sortOrder: number
  isActive: boolean
  // ★ 상품관리(/admin/shop-products) 화면 전용 필드 — 선택적으로 둔 이유:
  //   과거 별도였던 제휴상품 등록/수정 폼(현재는 상품관리로 통합됨)이 이 필드를 아예
  //   넘기지 않는 경로가 남아있을 수 있는데, 그때 update가 shop_category_id/
  //   shop_subcategory_id를 매번 null로 덮어써버리면 지정해둔 카테고리가 조용히
  //   날아가는 사고가 난다. 그래서 아래 update 로직에서 undefined일 땐 아예
  //   업데이트 대상에서 빼서 기존 값을 그대로 보존한다 (명시적으로 null을 넘기면 그건
  //   "미분류로 바꾼다"는 의도로 보고 실제로 null 처리한다).
  shopCategoryId?: string | null
  shopSubcategoryId?: string | null
}

export async function getAdminAffiliateProductById(id: string): Promise<unknown | null> {
  const auth = await requireAdminAction()
  if (!auth.ok) return null

  const admin = createAdminClient()
  const { data } = await admin.from('affiliate_products').select('*').eq('id', id).single()
  return data ?? null
}

export async function createAdminAffiliateProduct(
  fields: AdminAffiliateFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_products').insert({
    title: fields.title,
    price_text: fields.priceText,
    image_url: fields.imageUrl,
    link_url: fields.linkUrl,
    tags: fields.tags,
    sort_order: fields.sortOrder,
    is_active: fields.isActive,
    shop_category_id: fields.shopCategoryId ?? null,
    shop_subcategory_id: fields.shopSubcategoryId ?? null,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAdminAffiliateProduct(
  id: string, fields: AdminAffiliateFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const updatePayload: Record<string, unknown> = {
    title: fields.title,
    price_text: fields.priceText,
    image_url: fields.imageUrl,
    link_url: fields.linkUrl,
    tags: fields.tags,
    sort_order: fields.sortOrder,
    is_active: fields.isActive,
  }
  // undefined면 이 호출자가 카테고리 필드를 아예 모른다는 뜻이므로 건드리지 않는다(기존 값 보존).
  if (fields.shopCategoryId !== undefined) updatePayload.shop_category_id = fields.shopCategoryId
  if (fields.shopSubcategoryId !== undefined) updatePayload.shop_subcategory_id = fields.shopSubcategoryId

  const { error } = await admin.from('affiliate_products').update(updatePayload).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAdminAffiliateProduct(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_products').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function reactivateAdminAffiliateProduct(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_products').update({
    is_active: true,
    deactivated_reason: null,
    deactivated_at: null,
  }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 상품관리(샵 카테고리) ──────────────────────────────────────────
// affiliate_products 테이블을 공유해서 쓰되(위 제휴 상품 CRUD 그대로 재사용),
// shop_categories/shop_subcategories로 대분류·소분류 체계만 별도로 관리한다.
// (과거엔 /admin/affiliate가 별도 화면이었으나 /admin/shop-products 하나로 통합됨)
export interface AdminShopCategoryFields {
  name: string
  slug: string
  sortOrder: number
}

export async function getAdminShopCategories(): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shop_categories')
    .select('id, name, slug, sort_order, is_active')
    .order('sort_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createAdminShopCategory(
  fields: AdminShopCategoryFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('shop_categories').insert({
    name: fields.name,
    slug: fields.slug,
    sort_order: fields.sortOrder,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAdminShopCategory(
  id: string, fields: AdminShopCategoryFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('shop_categories').update({
    name: fields.name,
    slug: fields.slug,
    sort_order: fields.sortOrder,
  }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAdminShopCategory(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('shop_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export interface AdminShopSubcategoryFields {
  categoryId: string
  name: string
  slug: string
  sortOrder: number
}

export async function getAdminShopSubcategories(categoryId?: string): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  let q = admin
    .from('shop_subcategories')
    .select('id, category_id, name, slug, sort_order, is_active')
    .order('sort_order', { ascending: true })
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error } = await q
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createAdminShopSubcategory(
  fields: AdminShopSubcategoryFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('shop_subcategories').insert({
    category_id: fields.categoryId,
    name: fields.name,
    slug: fields.slug,
    sort_order: fields.sortOrder,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAdminShopSubcategory(
  id: string, fields: AdminShopSubcategoryFields,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('shop_subcategories').update({
    category_id: fields.categoryId,
    name: fields.name,
    slug: fields.slug,
    sort_order: fields.sortOrder,
  }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAdminShopSubcategory(id: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('shop_subcategories').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// 상품 목록 — affiliate_products를 샵 카테고리 배정 기준으로 조회 (미분류 포함 전체).
// click_count/impression_count/last_checked_at/deactivated_* 는 과거 /admin/affiliate
// 화면의 "확인 필요"·클릭률 표시 등에 쓰이던 필드로, 상품관리 통합 후에도 그대로 노출한다.
export async function getAdminShopProducts(): Promise<{ data: unknown[]; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { data: [], error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('affiliate_products')
    .select(
      'id, title, price_text, image_url, link_url, tags, sort_order, is_active, shop_category_id, shop_subcategory_id, ' +
      'click_count, impression_count, last_checked_at, deactivated_reason, deactivated_at'
    )
    .order('sort_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

// ── 상품 자동 생성(카테고리/하위카테고리 단위) ──────────────────────────
// 로컬 파이썬 스크립트(collect_shop_products.py)로 하던 "쿠팡 검색 → 신규 상품 저장"을
// 관리자 화면의 카테고리/하위카테고리 행 버튼으로 대체한다. 쿠팡 검색/저장 로직 자체는
// /api/admin/coupang/search, /api/admin/coupang/save 라우트와 같은 방식을 따르되,
// 중복 판별만 이 함수는 link_url 기준으로 한다(그 라우트들은 product_id 기준).
// product_id/coupang_product_id/last_checked_at도 함께 채워서 /api/cron/affiliate-health
// (product_id가 있는 상품만 자동 점검 대상으로 삼음)가 이후 정상적으로 점검할 수 있게 한다.
export async function generateShopProducts(
  categoryId: string, subcategoryId?: string,
): Promise<{ newCount?: number; skipCount?: number; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()

  const { data: category, error: catErr } = await admin
    .from('shop_categories')
    .select('id, name, search_keyword')
    .eq('id', categoryId)
    .single()
  if (catErr || !category) return { error: catErr?.message ?? '카테고리를 찾을 수 없습니다.' }

  let subcategory: { name: string; search_keyword: string | null } | null = null
  if (subcategoryId) {
    const { data, error: subErr } = await admin
      .from('shop_subcategories')
      .select('name, search_keyword')
      .eq('id', subcategoryId)
      .single()
    if (subErr || !data) return { error: subErr?.message ?? '하위카테고리를 찾을 수 없습니다.' }
    subcategory = data
  }

  const keyword = subcategory
    ? (subcategory.search_keyword || subcategory.name)
    : (category.search_keyword || category.name)

  const result = await searchProducts(keyword, 10)
  if (!result.ok) return { error: result.error }

  const linkUrls = result.data.map((p) => p.productUrl)
  const existingLinks = new Set<string>()
  if (linkUrls.length > 0) {
    const { data: existingRows, error: existingErr } = await admin
      .from('affiliate_products')
      .select('link_url')
      .in('link_url', linkUrls)
    if (existingErr) return { error: existingErr.message }
    for (const row of existingRows ?? []) existingLinks.add(row.link_url)
  }

  const newProducts = result.data.filter((p) => !existingLinks.has(p.productUrl))
  const skipCount = result.data.length - newProducts.length

  if (newProducts.length > 0) {
    const { data: maxRow } = await admin
      .from('affiliate_products')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    let nextSortOrder = (maxRow?.sort_order ?? 0) + 1

    const now = new Date().toISOString()
    const rows = newProducts.map((p) => ({
      title: p.productName,
      price_text: Number.isFinite(p.productPrice) ? `${p.productPrice.toLocaleString()}원` : null,
      image_url: p.productImage || null,
      link_url: p.productUrl,
      tags: suggestTagsFromTitle(p.productName),
      sort_order: nextSortOrder++,
      is_active: true,
      is_rocket: p.isRocket ?? null,
      is_free_shipping: p.isFreeShipping ?? null,
      coupang_product_id: String(p.productId),
      product_id: String(p.productId),
      last_checked_at: now,
      shop_category_id: categoryId,
      shop_subcategory_id: subcategoryId ?? null,
    }))

    const { error: insertErr } = await admin.from('affiliate_products').insert(rows)
    if (insertErr) return { error: insertErr.message }
  }

  const nowIso = new Date().toISOString()
  if (subcategoryId) {
    await admin.from('shop_subcategories').update({ last_collected_at: nowIso }).eq('id', subcategoryId)
  } else {
    await admin.from('shop_categories').update({ last_collected_at: nowIso }).eq('id', categoryId)
  }

  return { newCount: newProducts.length, skipCount }
}

// ── 상품 일괄 작업(체크박스 선택 후 카테고리/발행상태/태그/삭제) ──────────────────
export async function bulkUpdateAdminProductCategory(
  ids: string[], shopCategoryId: string | null, shopSubcategoryId: string | null,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }
  if (ids.length === 0) return { error: '선택된 상품이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('affiliate_products')
    .update({ shop_category_id: shopCategoryId, shop_subcategory_id: shopSubcategoryId })
    .in('id', ids)
  if (error) return { error: error.message }
  return { success: true }
}

export async function bulkUpdateAdminProductActive(
  ids: string[], isActive: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }
  if (ids.length === 0) return { error: '선택된 상품이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_products').update({ is_active: isActive }).in('id', ids)
  if (error) return { error: error.message }
  return { success: true }
}

// "확인 필요" 목록(자동 점검으로 비활성화된 상품)을 여러 개 한 번에 재활성화할 때 쓴다.
// bulkUpdateAdminProductActive와 달리 deactivated_reason/deactivated_at도 함께 지워서
// reactivateAdminAffiliateProduct(단건)와 동일하게 "확인 필요" 사유가 남지 않게 한다.
export async function bulkReactivateAdminProducts(ids: string[]): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }
  if (ids.length === 0) return { error: '선택된 상품이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_products').update({
    is_active: true,
    deactivated_reason: null,
    deactivated_at: null,
  }).in('id', ids)
  if (error) return { error: error.message }
  return { success: true }
}

export async function bulkAddAdminProductTags(
  ids: string[], tagsToAdd: string[],
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }
  if (ids.length === 0) return { error: '선택된 상품이 없습니다.' }
  if (tagsToAdd.length === 0) return { error: '추가할 태그를 입력해주세요.' }

  const admin = createAdminClient()
  const { data, error: fetchError } = await admin.from('affiliate_products').select('id, tags').in('id', ids)
  if (fetchError) return { error: fetchError.message }

  // 기존 태그를 덮어쓰지 않고 합집합으로 추가한다.
  const results = await Promise.all(
    (data ?? []).map((row) => {
      const merged = new Set<string>((row.tags as string[] | null) ?? [])
      for (const t of tagsToAdd) merged.add(t)
      return admin.from('affiliate_products').update({ tags: Array.from(merged) }).eq('id', row.id as string)
    })
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  return { success: true }
}

export async function bulkDeleteAdminProducts(ids: string[]): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if (!auth.ok) return { error: auth.error }
  if (ids.length === 0) return { error: '선택된 상품이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin.from('affiliate_products').delete().in('id', ids)
  if (error) return { error: error.message }
  return { success: true }
}
