'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function purchaseDream(
  dreamId: number,
  price: number,
): Promise<{ success?: boolean; error?: string; debug?: Record<string, unknown> }> {
  const debug: Record<string, unknown> = { dreamId, price, steps: [] as string[] }
  const steps = debug.steps as string[]

  // ── 0. SERVICE_ROLE_KEY 확인 ─────────────────────────────────
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  debug.hasServiceKey = hasServiceKey
  console.log('[purchase] 0. SERVICE_ROLE_KEY 존재:', hasServiceKey)
  if (!hasServiceKey) {
    console.error('[purchase] ❌ SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없음!')
    return { error: '서버 설정 오류 (SERVICE_ROLE_KEY 누락)', debug }
  }

  // ── 1. 로그인 사용자 확인 ────────────────────────────────────
  steps.push('auth')
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  console.log('[purchase] 1. getUser →', user?.id ?? null, authErr?.message ?? 'OK')
  if (authErr || !user) {
    debug.authError = authErr?.message
    return { error: '로그인이 필요합니다', debug }
  }
  debug.userId = user.id

  const admin = createAdminClient()

  // ── 2. 꿈 조회 ───────────────────────────────────────────────
  steps.push('fetchDream')
  const { data: dream, error: dreamErr } = await admin
    .from('dreams')
    .select('id, title, user_id, is_sold, price')
    .eq('id', dreamId)
    .single()
  console.log('[purchase] 2. dream →', dream, dreamErr?.message ?? 'OK')
  if (dreamErr || !dream) {
    debug.dreamError = dreamErr?.message
    return { error: '존재하지 않는 꿈입니다', debug }
  }
  if (dream.is_sold) return { error: '이미 판매된 꿈입니다', debug }
  if (dream.user_id === user.id) return { error: '본인의 꿈은 구매할 수 없습니다', debug }

  // ── 3. 구매자 잔액 확인 ──────────────────────────────────────
  steps.push('buyerProfile')
  const { data: buyerProfile, error: buyerErr } = await admin
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()
  console.log('[purchase] 3. buyerProfile →', buyerProfile, buyerErr?.message ?? 'OK')
  if (buyerErr || !buyerProfile) {
    debug.buyerError = buyerErr?.message
    return { error: '프로필을 찾을 수 없습니다', debug }
  }
  if (buyerProfile.points < price) {
    return { error: `포인트 부족 (보유: ${buyerProfile.points}, 필요: ${price})`, debug }
  }

  // ── 4. is_sold 선점 (동시 구매 방지) ────────────────────────
  steps.push('lockDream')
  const { data: locked, error: lockErr } = await admin
    .from('dreams')
    .update({ is_sold: true })
    .eq('id', dreamId)
    .eq('is_sold', false)
    .select('id')
  console.log('[purchase] 4. lock →', locked, lockErr?.message ?? 'OK')
  if (lockErr) {
    debug.lockError = lockErr.message
    return { error: `is_sold 업데이트 실패: ${lockErr.message}`, debug }
  }
  if (!locked || locked.length === 0) {
    return { error: '이미 판매된 꿈입니다', debug }
  }

  // ── 5. 구매 기록 삽입 ────────────────────────────────────────
  steps.push('insertPurchase')
  const { error: purchaseErr } = await admin
    .from('purchases')
    .insert({ buyer_id: user.id, dream_id: dreamId, price })
  console.log('[purchase] 5. insertPurchase →', purchaseErr?.message ?? 'OK')
  if (purchaseErr) {
    debug.purchaseError = purchaseErr.message
    await admin.from('dreams').update({ is_sold: false }).eq('id', dreamId)
    return { error: `purchases 삽입 실패: ${purchaseErr.message}`, debug }
  }

  // ── 6. 구매자 포인트 차감 ────────────────────────────────────
  steps.push('deductBuyer')
  const { error: deductErr } = await admin
    .from('profiles')
    .update({ points: buyerProfile.points - price })
    .eq('id', user.id)
  console.log('[purchase] 6. deductBuyer →', deductErr?.message ?? 'OK')
  if (deductErr) debug.deductError = deductErr.message

  // ── 7. 구매자 포인트 로그 ────────────────────────────────────
  steps.push('buyerLog')
  const { error: buyLogErr } = await admin.from('point_logs').insert({
    user_id: user.id,
    amount: -price,
    type: 'use',
    description: `꿈 구매 — ${dream.title}`,
  })
  console.log('[purchase] 7. buyerLog →', buyLogErr?.message ?? 'OK')
  if (buyLogErr) debug.buyerLogError = buyLogErr.message

  // ── 8. 판매자 포인트 지급 ────────────────────────────────────
  steps.push('sellerEarning')
  const sellerEarning = Math.floor(price * 0.9)
  const { data: sellerProfile, error: sellerErr } = await admin
    .from('profiles')
    .select('points')
    .eq('id', dream.user_id)
    .single()
  console.log('[purchase] 8. sellerProfile →', sellerProfile, sellerErr?.message ?? 'OK')

  if (sellerProfile) {
    const { error: earnErr } = await admin
      .from('profiles')
      .update({ points: sellerProfile.points + sellerEarning })
      .eq('id', dream.user_id)
    console.log('[purchase] 8a. sellerPointUpdate →', earnErr?.message ?? 'OK')
    if (earnErr) debug.earnError = earnErr.message

    const { error: earnLogErr } = await admin.from('point_logs').insert({
      user_id: dream.user_id,
      amount: sellerEarning,
      type: 'earn',
      description: `꿈 판매 수익 — ${dream.title}`,
    })
    console.log('[purchase] 8b. sellerLog →', earnLogErr?.message ?? 'OK')
    if (earnLogErr) debug.earnLogError = earnLogErr.message
  } else {
    console.warn('[purchase] ⚠️ 판매자 프로필 없음 — 포인트 지급 건너뜀 (seller_id:', dream.user_id, ')')
    debug.sellerWarning = '판매자 프로필 없음'
  }

  console.log('[purchase] ✅ 완료 — debug:', JSON.stringify(debug, null, 2))
  return { success: true, debug }
}

export async function deleteDream(
  dreamId: number,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: '로그인이 필요합니다' }

  const admin = createAdminClient()
  const { data: dream } = await admin
    .from('dreams')
    .select('user_id, is_sold')
    .eq('id', dreamId)
    .single()

  if (!dream) return { error: '존재하지 않는 꿈입니다' }
  if (dream.user_id !== user.id) return { error: '권한이 없습니다' }
  if (dream.is_sold) return { error: '판매된 꿈은 삭제할 수 없습니다' }

  const { error: deleteErr } = await admin
    .from('dreams')
    .delete()
    .eq('id', dreamId)

  if (deleteErr) return { error: deleteErr.message }
  return { success: true }
}

export async function updateDream(
  dreamId: number,
  updates: { title: string; summary: string; content: string; price: number; category: string },
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: '로그인이 필요합니다' }

  const admin = createAdminClient()
  const { data: dream } = await admin
    .from('dreams')
    .select('user_id, is_sold')
    .eq('id', dreamId)
    .single()

  if (!dream) return { error: '존재하지 않는 꿈입니다' }
  if (dream.user_id !== user.id) return { error: '권한이 없습니다' }
  if (dream.is_sold) return { error: '판매된 꿈은 수정할 수 없습니다' }

  const { error: updateErr } = await admin
    .from('dreams')
    .update(updates)
    .eq('id', dreamId)

  if (updateErr) return { error: updateErr.message }
  return { success: true }
}
