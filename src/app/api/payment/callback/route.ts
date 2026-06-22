import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment, verifyNicepaySignature } from '@/lib/nicepay'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

// NicePay 인증 후 POST (application/x-www-form-urlencoded)
export async function POST(req: NextRequest) {
  const text   = await req.text()
  const params = new URLSearchParams(text)

  const authResultCode = params.get('authResultCode') ?? ''
  const authResultMsg  = params.get('authResultMsg')  ?? ''
  const tid            = params.get('tid')            ?? ''
  const orderId        = params.get('orderId')        ?? ''
  const amount         = Number(params.get('amount'))
  const authToken      = params.get('authToken')      ?? ''
  const signature      = params.get('signature')      ?? ''

  console.log('[Callback] 수신:', { authResultCode, authResultMsg, tid, orderId, amount })

  const admin = createAdminClient()

  if (!orderId || !amount) {
    console.error('[Callback] 필수값 누락')
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 인증 실패 (사용자 취소 포함)
  if (authResultCode !== '0000') {
    console.error('[Callback] 인증 실패:', authResultCode, authResultMsg)
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge`, { status: 302 })
  }

  // 위변조 검증
  if (!verifyNicepaySignature(authToken, amount, signature)) {
    console.error('[Callback] 위변조 감지:', orderId)
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // DB 결제 조회
  const { data: payment } = await admin
    .from('payments')
    .select('user_id, status, amount')
    .eq('order_id', orderId)
    .single()

  if (!payment) {
    console.error('[Callback] 결제 기록 없음:', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  if (payment.status === 'completed') {
    console.log('[Callback] 이미 완료된 결제:', orderId)
    return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
  }

  // 금액 위변조 검증
  if (payment.amount !== amount) {
    console.error('[Callback] 금액 불일치:', { db: payment.amount, received: amount })
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // NicePay 승인 API 호출
  console.log('[Callback] 승인 API 호출:', { tid, amount })
  let approval: Awaited<ReturnType<typeof approveNicepayPayment>>
  try {
    approval = await approveNicepayPayment(tid, amount)
    console.log('[Callback] 승인 결과:', approval)
  } catch (err) {
    console.error('[Callback] 승인 API 오류:', err)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  if (approval.resultCode !== '0000') {
    console.error('[Callback] 승인 실패:', approval.resultCode, approval.resultMsg)
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 포인트 충전
  const { data: profile } = await admin
    .from('profiles')
    .select('points')
    .eq('id', payment.user_id)
    .single()

  const newPoints = (profile?.points ?? 0) + amount
  console.log('[Callback] 포인트 충전:', { userId: payment.user_id, newPoints })

  await Promise.all([
    admin.from('payments').update({
      status:       'completed',
      payment_id:   tid,
      balance_amt:  amount,
      completed_at: new Date().toISOString(),
      card_name:    approval.card?.cardName   ?? null,
      card_quota:   approval.card?.cardQuota  ?? null,
    }).eq('order_id', orderId),
    admin.from('profiles').update({ points: newPoints }).eq('id', payment.user_id),
    admin.from('point_logs').insert({
      user_id:     payment.user_id,
      amount,
      type:        'charge',
      description: `포인트 충전 (${approval.payMethod ?? 'card'}, 주문 ${orderId})`,
    }),
  ])

  console.log('[Callback] 완료, 리다이렉트:', orderId)
  return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
}
