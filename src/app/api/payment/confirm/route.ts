import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment, verifyNicepaySignature } from '@/lib/nicepay'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

// NicePay가 결제 인증 후 이 URL로 POST(application/x-www-form-urlencoded) 합니다
export async function POST(req: NextRequest) {
  const text   = await req.text()
  const params = new URLSearchParams(text)

  const authResultCode = params.get('authResultCode') ?? ''
  const tid            = params.get('tid')            ?? ''
  const orderId        = params.get('orderId')        ?? ''
  const amount         = Number(params.get('amount'))
  const authToken      = params.get('authToken')      ?? ''
  const signature      = params.get('signature')      ?? ''

  const admin = createAdminClient()

  if (!orderId || !amount) {
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // ── 결제 취소/인증 실패 ──────────────────────────────────────
  if (authResultCode !== '0000') {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // ── 위변조 검증 (signature) ──────────────────────────────────
  if (!verifyNicepaySignature(authToken, amount, signature)) {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // ── 결제 기록 조회 ────────────────────────────────────────────
  const { data: payment } = await admin
    .from('payments')
    .select('user_id, status, amount')
    .eq('order_id', orderId)
    .single()

  if (!payment) {
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // 멱등성: 이미 처리된 주문
  if (payment.status === 'completed') {
    return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
  }

  // ── 금액 위변조 검증 (DB 저장 금액과 일치 여부) ────────────────
  if (payment.amount !== amount) {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // ── NicePay 승인 API 호출 ─────────────────────────────────────
  let approval: Awaited<ReturnType<typeof approveNicepayPayment>>
  try {
    approval = await approveNicepayPayment(tid, amount)
  } catch {
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  if (approval.resultCode !== '0000') {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // ── 포인트 지급 ────────────────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('points')
    .eq('id', payment.user_id)
    .single()

  const newPoints = (profile?.points ?? 0) + amount

  await Promise.all([
    admin.from('payments').update({
      status:       'completed',
      payment_id:   tid,
      completed_at: new Date().toISOString(),
    }).eq('order_id', orderId),
    admin.from('profiles')
      .update({ points: newPoints })
      .eq('id', payment.user_id),
    admin.from('point_logs').insert({
      user_id:     payment.user_id,
      amount,
      type:        'charge',
      description: `포인트 충전 (주문 ${orderId})`,
    }),
  ])

  return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
}
