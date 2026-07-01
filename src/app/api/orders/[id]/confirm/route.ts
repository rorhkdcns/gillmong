import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST /api/orders/[id]/confirm
// 구매자가 구매확정 → settled 전환, 판매자 포인트 지급
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const admin = createAdminClient()

    const { data: order } = await admin
      .from('orders')
      .select('id, buyer_id, seller_id, seller_amount, status, dream_id')
      .eq('id', id)
      .single()

    if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
    if (order.buyer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    if (order.status !== 'paid_escrow') {
      return NextResponse.json({ error: '구매확정 가능한 상태가 아닙니다' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // settled 전환 + 판매자 포인트 지급
    const { data: sellerProfile } = await admin
      .from('profiles')
      .select('points')
      .eq('id', order.seller_id)
      .single()

    await Promise.all([
      admin.from('orders').update({
        status:       'settled',
        confirmed_at: now,
        settled_at:   now,
        updated_at:   now,
      }).eq('id', id),
      ...(sellerProfile ? [
        admin.from('profiles')
          .update({ points: sellerProfile.points + order.seller_amount })
          .eq('id', order.seller_id),
        admin.from('point_logs').insert({
          user_id:     order.seller_id,
          amount:      order.seller_amount,
          type:        'earn',
          description: `꿈 판매 정산 (주문 ${id.substring(0, 8)}...)`,
        }),
      ] : []),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[OrderConfirm] 오류:', err)
    return NextResponse.json({ error: '처리 중 오류 발생' }, { status: 500 })
  }
}
