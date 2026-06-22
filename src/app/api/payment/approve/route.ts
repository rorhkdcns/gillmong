import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment } from '@/lib/nicepay'

// POST /api/payment/approve
// body: { tid, orderId, amount }
export async function POST(req: NextRequest) {
  try {
    const { tid, orderId, amount } = await req.json()
    console.log('[Approve] 요청:', { tid, orderId, amount })

    if (!tid || !orderId || !amount) {
      return NextResponse.json({ error: '필수 파라미터 누락 (tid, orderId, amount)' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('user_id, status, amount')
      .eq('order_id', orderId)
      .single()

    if (!payment) {
      console.error('[Approve] 결제 기록 없음:', orderId)
      return NextResponse.json({ error: '결제 기록 없음' }, { status: 404 })
    }

    if (payment.status === 'completed') {
      console.log('[Approve] 이미 완료:', orderId)
      return NextResponse.json({ success: true, already: true })
    }

    if (payment.amount !== amount) {
      console.error('[Approve] 금액 불일치:', { db: payment.amount, received: amount })
      return NextResponse.json({ error: '금액 불일치' }, { status: 400 })
    }

    // NicePay 승인
    console.log('[Approve] NicePay 승인 API 호출:', { tid, amount })
    const approval = await approveNicepayPayment(tid, amount)
    console.log('[Approve] 승인 결과:', approval)

    if (approval.resultCode !== '0000') {
      await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
      return NextResponse.json({ error: approval.resultMsg }, { status: 400 })
    }

    // 포인트 충전
    const { data: profile } = await admin
      .from('profiles')
      .select('points')
      .eq('id', payment.user_id)
      .single()

    const newPoints = (profile?.points ?? 0) + amount
    console.log('[Approve] 포인트 충전:', { userId: payment.user_id, newPoints })

    await Promise.all([
      admin.from('payments').update({
        status:       'completed',
        payment_id:   tid,
        balance_amt:  amount,
        completed_at: new Date().toISOString(),
        card_name:    approval.card?.cardName  ?? null,
        card_quota:   approval.card?.cardQuota ?? null,
      }).eq('order_id', orderId),
      admin.from('profiles').update({ points: newPoints }).eq('id', payment.user_id),
      admin.from('point_logs').insert({
        user_id:     payment.user_id,
        amount,
        type:        'charge',
        description: `포인트 충전 (카드, 주문 ${orderId})`,
      }),
    ])

    console.log('[Approve] 완료:', orderId)
    return NextResponse.json({ success: true, newPoints })
  } catch (err) {
    console.error('[Approve] 오류:', err)
    return NextResponse.json({ error: '승인 처리 중 오류 발생' }, { status: 500 })
  }
}
