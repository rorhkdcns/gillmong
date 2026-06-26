'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function syncSalePoints(): Promise<{
  success?: boolean
  synced?: number
  soldFixed?: number
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

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
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('id, points').eq('username', username).single()
  if (!profile) return { error: '존재하지 않는 아이디입니다.' }
  const newPoints = profile.points + amount
  if (newPoints < 0) return { error: `포인트가 부족합니다. (보유: ${profile.points.toLocaleString()}P)` }
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
  const admin = createAdminClient()
  await admin.from('point_logs').delete().like('description', `%${dreamId}%`)
  await admin.from('purchases').delete().eq('dream_id', dreamId)
  const { error } = await admin.from('dreams').delete().eq('id', dreamId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 거래 내역 ──────────────────────────────────────────────────
export async function getAdminTransactions(): Promise<unknown[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('purchases')
    .select('id, price, created_at, dreams(id, title, grade), profiles!buyer_id(nickname, username)')
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown[]
}

// ── 공지사항 ───────────────────────────────────────────────────
export async function getAdminNotices() {
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
  const admin = createAdminClient()
  const { error } = await admin.from('notices').insert({ title, content, is_pinned: isPinned })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAdminNotice(id: number): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('notices').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getAdminNoticeById(id: number): Promise<{ id: number; title: string; content: string; is_pinned: boolean } | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('notices').select('id, title, content, is_pinned').eq('id', id).single()
  return data ?? null
}

export async function updateAdminNotice(
  id: number, title: string, content: string, isPinned: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('notices').update({ title, content, is_pinned: isPinned }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 1:1 문의 ───────────────────────────────────────────────────
export async function getAdminInquiries() {
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
  const admin = createAdminClient()
  const { error } = await admin
    .from('withdrawal_requests')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
