import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// NicePay 가상계좌 입금 확인 웹훅 (NicePay 대시보드에 등록 필요)
// NicePay → POST /api/payment/vbank-notify
export async function POST(req: NextRequest) {
  try {
    const text   = await req.text()
    const params = new URLSearchParams(text)

    const resultCode = params.get('resultCode') ?? ''
    const tid        = params.get('tid')        ?? ''
    const orderId    = params.get('orderId')    ?? ''
    const amount     = Number(params.get('amount'))

    if (resultCode !== '0000' || !tid || !orderId || !amount) {
      return new NextResponse('fail', { status: 400 })
    }

    const admin = createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('user_id, status, amount')
      .eq('order_id', orderId)
      .single()

    if (!payment) return new NextResponse('fail', { status: 404 })
    if (payment.status === 'completed') return new NextResponse('ok', { status: 200 })
    if (payment.amount !== amount) return new NextResponse('fail', { status: 400 })

    // 포인트 지급
    const { data: profile } = await admin
      .from('profiles')
      .select('points')
      .eq('id', payment.user_id)
      .single()

    const newPoints = (profile?.points ?? 0) + amount

    await Promise.all([
      admin.from('payments').update({
        status:       'completed',
        completed_at: new Date().toISOString(),
      }).eq('order_id', orderId),
      admin.from('profiles').update({ points: newPoints }).eq('id', payment.user_id),
      admin.from('point_logs').insert({
        user_id:     payment.user_id,
        amount,
        type:        'charge',
        description: `포인트 충전 (가상계좌 입금, 주문 ${orderId})`,
      }),
    ])

    return new NextResponse('ok', { status: 200 })
  } catch {
    return new NextResponse('fail', { status: 500 })
  }
}
