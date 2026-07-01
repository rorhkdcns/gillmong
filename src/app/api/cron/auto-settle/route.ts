import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/cron/auto-settle
// Vercel Cron이 매일 새벽 1시(KST) 호출
// confirm_deadline이 지난 paid_escrow 주문을 자동 settled 처리
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: overdueOrders, error } = await admin
    .from('orders')
    .select('id, seller_id, seller_amount')
    .eq('status', 'paid_escrow')
    .lt('confirm_deadline', new Date().toISOString())

  if (error) {
    console.error('[AutoSettle] 조회 오류:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!overdueOrders || overdueOrders.length === 0) {
    return NextResponse.json({ settled: 0, message: '대상 없음' })
  }

  const now = new Date().toISOString()
  let settled = 0

  for (const order of overdueOrders) {
    try {
      const { data: sellerProfile } = await admin
        .from('profiles')
        .select('points')
        .eq('id', order.seller_id)
        .single()

      await Promise.all([
        admin.from('orders').update({
          status:     'settled',
          settled_at: now,
          updated_at: now,
        }).eq('id', order.id),
        ...(sellerProfile ? [
          admin.from('profiles')
            .update({ points: sellerProfile.points + order.seller_amount })
            .eq('id', order.seller_id),
          admin.from('point_logs').insert({
            user_id:     order.seller_id,
            amount:      order.seller_amount,
            type:        'earn',
            description: `꿈 판매 자동정산 (주문 ${order.id.substring(0, 8)}...)`,
          }),
        ] : []),
      ])
      settled++
    } catch (e) {
      console.error('[AutoSettle] 주문 처리 오류:', order.id, e)
    }
  }

  console.log(`[AutoSettle] 완료: ${settled}건 정산`)
  return NextResponse.json({ settled, total: overdueOrders.length })
}
