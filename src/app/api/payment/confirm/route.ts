import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment } from '@/lib/nicepay'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

// NicePay가 결제 완료 후 이 URL로 POST 합니다
export async function POST(req: NextRequest) {
  const text   = await req.text()
  const params = new URLSearchParams(text)

  const tid            = params.get('tid')
  const orderId        = params.get('orderId')
  const amount         = Number(params.get('amount'))
  const authResultCode = params.get('authResultCode') ?? params.get('resultCode') ?? ''

  if (!tid || !orderId || !amount) {
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // 사용자가 결제를 취소한 경우
  if (authResultCode !== '0000') {
    await createAdminClient()
      .from('payments')
      .update({ status: 'failed' })
      .eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // NicePay 승인 API 호출
  let approval: { resultCode: string; resultMsg: string; tid: string; status: string }
  try {
    approval = await approveNicepayPayment(tid, amount, orderId)
  } catch {
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  const admin = createAdminClient()

  if (approval.resultCode !== '0000') {
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }

  // 결제 기록 조회 (멱등성: 이미 처리된 경우 바로 성공 반환)
  const { data: payment } = await admin
    .from('payments')
    .select('user_id, status')
    .eq('order_id', orderId)
    .single()

  if (!payment) {
    return NextResponse.redirect(`${SITE}/charge/cancel`, { status: 302 })
  }
  if (payment.status === 'completed') {
    return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
  }

  // 포인트 충전 + 기록 저장
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
      amount:      amount,
      type:        'charge',
      description: `포인트 충전 (주문 ${orderId})`,
    }),
  ])

  return NextResponse.redirect(`${SITE}/charge/success?amount=${amount}`, { status: 302 })
}
