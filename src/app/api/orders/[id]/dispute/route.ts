import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST /api/orders/[id]/dispute
// body: { reason }
// 구매자가 환불요청 → disputed 전환
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { reason } = await req.json()

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: '환불 사유를 5자 이상 입력해주세요' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const admin = createAdminClient()

    const { data: order } = await admin
      .from('orders')
      .select('id, buyer_id, status')
      .eq('id', id)
      .single()

    if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
    if (order.buyer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    if (order.status !== 'paid_escrow') {
      return NextResponse.json({ error: '환불 요청 가능한 상태가 아닙니다' }, { status: 400 })
    }

    await admin.from('orders').update({
      status:         'disputed',
      dispute_reason: reason.trim(),
      updated_at:     new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[OrderDispute] 오류:', err)
    return NextResponse.json({ error: '처리 중 오류 발생' }, { status: 500 })
  }
}
