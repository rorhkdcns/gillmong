import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment, verifyNicepaySignature } from '@/lib/nicepay'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

// NicePay가 결제 인증 후 POST(application/x-www-form-urlencoded)
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
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 결제 취소 / 인증 실패
  if (authResultCode !== '0000') {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 위변조 검증: hex(sha256(authToken + clientId + amount + SecretKey))
  if (!verifyNicepaySignature(authToken, amount, signature)) {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 결제 기록 조회
  const { data: payment } = await admin
    .from('payments')
    .select('user_id, status, amount, payment_method')
    .eq('order_id', orderId)
    .single()

  if (!payment) {
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }
  if (payment.status === 'completed') {
    return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
  }

  // 금액 위변조 검증
  if (payment.amount !== amount) {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 승인 API 호출
  let approval: Awaited<ReturnType<typeof approveNicepayPayment>>
  try {
    approval = await approveNicepayPayment(tid, amount)
  } catch {
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  if (approval.resultCode !== '0000') {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // ── 가상계좌: 채번 완료, 입금 대기 ──────────────────────────────
  if (approval.status === 'ready' && approval.vbank) {
    const v = approval.vbank
    await admin.from('payments').update({
      status:       'ready',
      payment_id:   tid,
      balance_amt:  amount,
      vbank_name:   v.vbankName,
      vbank_number: v.vbankNumber,
      vbank_holder: v.vbankHolder,
      vbank_exp_date: v.vbankExpDate,
    }).eq('order_id', orderId)

    const q = new URLSearchParams({
      amount:       String(amount),
      method:       'vbank',
      vbankName:    v.vbankName,
      vbankNumber:  v.vbankNumber,
      vbankHolder:  v.vbankHolder,
      vbankExpDate: v.vbankExpDate,
    })
    return NextResponse.redirect(`${SITE}/charge/success?${q}`, { status: 302 })
  }

  // ── 즉시 결제 완료 (카드 / 간편결제 / 휴대폰 / 계좌이체) ────────
  const { data: profile } = await admin
    .from('profiles')
    .select('points')
    .eq('id', payment.user_id)
    .single()

  const newPoints = (profile?.points ?? 0) + amount
  const cardInfo  = approval.card

  await Promise.all([
    admin.from('payments').update({
      status:       'completed',
      payment_id:   tid,
      balance_amt:  amount,
      completed_at: new Date().toISOString(),
      card_name:    cardInfo?.cardName ?? null,
      card_quota:   cardInfo?.cardQuota ?? null,
    }).eq('order_id', orderId),
    admin.from('profiles').update({ points: newPoints }).eq('id', payment.user_id),
    admin.from('point_logs').insert({
      user_id:     payment.user_id,
      amount,
      type:        'charge',
      description: `포인트 충전 (${approval.payMethod ?? payment.payment_method}, 주문 ${orderId})`,
    }),
  ])

  return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
}
