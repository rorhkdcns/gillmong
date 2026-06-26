import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 어드민 확인
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { dreamId, reportId } = (await req.json()) as { dreamId: number; reportId?: number }
  if (!dreamId) {
    return NextResponse.json({ error: 'dreamId가 필요합니다.' }, { status: 400 })
  }

  // 해당 꿈의 모든 구매자 조회
  const { data: purchases, error: purchasesErr } = await admin
    .from('purchases')
    .select('id, price, buyer_id')
    .eq('dream_id', dreamId)

  if (purchasesErr) {
    return NextResponse.json({ error: `구매 내역 조회 실패: ${purchasesErr.message}` }, { status: 500 })
  }

  // 꿈 제목 조회 (환불 로그 설명용)
  const { data: dream } = await admin
    .from('dreams')
    .select('title')
    .eq('id', dreamId)
    .single()
  const dreamTitle = dream?.title ?? `#${dreamId}`

  // 각 구매자에게 포인트 환불
  const refundErrors: string[] = []
  for (const purchase of purchases ?? []) {
    const { data: buyer } = await admin
      .from('profiles')
      .select('points')
      .eq('id', purchase.buyer_id)
      .single()

    if (!buyer) continue

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ points: buyer.points + purchase.price })
      .eq('id', purchase.buyer_id)

    if (updateErr) {
      refundErrors.push(purchase.buyer_id)
      continue
    }

    await admin.from('point_logs').insert({
      user_id: purchase.buyer_id,
      amount: purchase.price,
      type: 'refund',
      description: `신고 처리 환불 — ${dreamTitle}`,
    })
  }

  // 꿈 삭제
  const { error: deleteErr } = await admin
    .from('dreams')
    .delete()
    .eq('id', dreamId)

  if (deleteErr) {
    return NextResponse.json({ error: `꿈 삭제 실패: ${deleteErr.message}` }, { status: 500 })
  }

  // 관련 신고 전체를 resolved 처리
  await admin
    .from('reports')
    .update({ status: 'resolved' })
    .eq('dream_id', dreamId)

  return NextResponse.json({
    success: true,
    refunded: (purchases ?? []).length,
    refundErrors,
  })
}
