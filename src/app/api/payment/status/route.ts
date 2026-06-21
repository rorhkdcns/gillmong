import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { queryNicepayPayment } from '@/lib/nicepay'

// GET /api/payment/status?orderId=ORDER_xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId 누락' }, { status: 400 })

  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('user_id, status, amount, payment_method, payment_id, balance_amt, vbank_name, vbank_number, vbank_holder, vbank_exp_date, created_at, completed_at')
    .eq('order_id', orderId)
    .single()

  if (!payment) return NextResponse.json({ error: '결제 기록 없음' }, { status: 404 })

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (payment.user_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  // tid가 있으면 NicePay에서 최신 상태도 조회
  let nicepayStatus = null
  if (payment.payment_id) {
    try {
      nicepayStatus = await queryNicepayPayment(payment.payment_id)
    } catch { /* NicePay 조회 실패 시 DB 정보만 반환 */ }
  }

  return NextResponse.json({ payment, nicepayStatus })
}
