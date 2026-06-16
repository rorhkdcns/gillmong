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

    const sellerEarning = Math.floor(purchase.price * 0.9)
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
export async function getAdminUsers(search?: string) {
  const admin = createAdminClient()
  let q = admin.from('profiles').select('id, nickname, username, points, created_at').order('created_at', { ascending: false })
  if (search) q = q.or(`nickname.ilike.%${search}%,username.ilike.%${search}%`)
  const { data } = await q
  return data ?? []
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
  await admin.from('point_logs').delete().eq('user_id', userId)
  const { data: purchases } = await admin.from('purchases').select('dream_id').eq('buyer_id', userId)
  for (const p of purchases ?? []) {
    await admin.from('dreams').update({ is_sold: false }).eq('id', p.dream_id)
  }
  await admin.from('purchases').delete().eq('buyer_id', userId)
  await admin.from('dreams').delete().eq('user_id', userId)
  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── 꿈 관리 ───────────────────────────────────────────────────
export async function getAdminDreams(category?: string, isSold?: string): Promise<unknown[]> {
  const admin = createAdminClient()
  let q = admin.from('dreams').select('id, title, grade, category, price, is_sold, created_at, profiles!user_id(nickname, username)').order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  if (isSold === 'true')  q = q.eq('is_sold', true)
  if (isSold === 'false') q = q.eq('is_sold', false)
  const { data } = await q
  return (data ?? []) as unknown[]
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

// ── 출금 신청 ──────────────────────────────────────────────────
export async function getAdminWithdrawals() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('withdrawals')
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
    .from('withdrawals')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
