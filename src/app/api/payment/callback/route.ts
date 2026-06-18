import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, status, amount, paymentId } = body

    console.log('결제 콜백 수신:', { orderId, status, amount })

    const supabase = createAdminClient()

    // 1. 기존 결제 기록 조회
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('user_id, status')
      .eq('order_id', orderId)
      .single()

    if (fetchError || !payment) {
      console.error('결제 기록 없음:', orderId)
      return NextResponse.json({ error: '결제 기록 없음' }, { status: 404 })
    }

    // 2. 이미 처리된 주문인지 확인 (멱등성)
    if (payment.status === 'completed') {
      console.log('이미 처리된 주문:', orderId)
      return NextResponse.json({ success: true })
    }

    // 3. 결제 성공 처리
    if (status === 'success' || status === 'paid' || status === '0000') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', payment.user_id)
        .single()

      const newPoints = (profile?.points ?? 0) + Math.floor(amount)

      await Promise.all([
        supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', payment.user_id),
        supabase.from('point_logs').insert({
          user_id:    payment.user_id,
          points:     Math.floor(amount),
          type:       'charged',
          reason:     `포인트 충전 (주문ID: ${orderId})`,
          created_at: new Date().toISOString(),
        }),
        supabase
          .from('payments')
          .update({
            status:       'completed',
            payment_id:   paymentId,
            completed_at: new Date().toISOString(),
          })
          .eq('order_id', orderId),
      ])

      console.log(`결제 완료: ${orderId} → ${payment.user_id}에 ${amount}P 추가`)
      return NextResponse.json({ success: true })
    }

    // 4. 결제 실패 처리
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('order_id', orderId)

    console.log(`결제 실패: ${orderId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('콜백 처리 오류:', error)
    return NextResponse.json({ error: '콜백 처리 실패' }, { status: 500 })
  }
}
