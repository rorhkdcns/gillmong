import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelNicepayPayment } from '@/lib/nicepay'

// POST /api/payment/cancel
// body: { orderId, cancelAmt, reason }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { orderId, cancelAmt, reason = '사용자 요청 취소' } = await req.json()
  if (!orderId || !cancelAmt) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('user_id, status, payment_id, amount, balance_amt')
    .eq('order_id', orderId)
    .single()

  if (!payment) return NextResponse.json({ error: '결제 기록 없음' }, { status: 404 })

  // 본인 결제만 취소 가능 (관리자 예외는 is_admin 체크)
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (payment.user_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  if (payment.status !== 'completed') {
    return NextResponse.json({ error: '취소 가능한 상태가 아닙니다' }, { status: 400 })
  }

  const tid          = payment.payment_id
  const balanceAmt   = payment.balance_amt ?? payment.amount
  if (!tid) return NextResponse.json({ error: 'TID 없음' }, { status: 400 })
  if (cancelAmt > balanceAmt) {
    return NextResponse.json({ error: `취소 가능 잔액(${balanceAmt}원)을 초과합니다` }, { status: 400 })
  }

  // NicePay 취소 API 호출
  let result: Awaited<ReturnType<typeof cancelNicepayPayment>>
  try {
    result = await cancelNicepayPayment(tid, cancelAmt, reason, orderId)
  } catch {
    return NextResponse.json({ error: '취소 요청 실패' }, { status: 500 })
  }

  if (result.resultCode !== '0000') {
    return NextResponse.json({ error: result.resultMsg ?? '취소 실패' }, { status: 400 })
  }

  const newBalance   = result.balanceAmt
  const isFullCancel = newBalance === 0
  const newStatus    = isFullCancel ? 'cancelled' : 'partialCancelled'

  // 포인트 차감
  const { data: userProfile } = await admin
    .from('profiles')
    .select('points')
    .eq('id', payment.user_id)
    .single()

  const newPoints = Math.max(0, (userProfile?.points ?? 0) - cancelAmt)

  await Promise.all([
    admin.from('payments').update({
      status:      newStatus,
      balance_amt: newBalance,
    }).eq('order_id', orderId),
    admin.from('profiles').update({ points: newPoints }).eq('id', payment.user_id),
    admin.from('point_logs').insert({
      user_id:     payment.user_id,
      amount:      -cancelAmt,
      type:        'use',
      description: `포인트 취소 환불 (주문 ${orderId}, ${isFullCancel ? '전액' : '부분'} 취소)`,
    }),
  ])

  return NextResponse.json({
    success:    true,
    cancelAmt,
    balanceAmt: newBalance,
    status:     newStatus,
  })
}
