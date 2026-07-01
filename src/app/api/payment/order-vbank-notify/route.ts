import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// NicePay 가상계좌 입금 확인 웹훅 — 꿈 구매용
// NicePay 대시보드에 /api/payment/order-vbank-notify 등록 필요
export async function POST(req: NextRequest) {
  try {
    const text   = await req.text()
    const params = new URLSearchParams(text)

    const resultCode = params.get('resultCode') ?? ''
    const orderId    = params.get('orderId')    ?? ''
    const amount     = Number(params.get('amount'))

    if (resultCode !== '0000' || !orderId || !amount) {
      return new NextResponse('fail', { status: 400 })
    }

    const admin = createAdminClient()

    const { data: order } = await admin
      .from('orders')
      .select('id, status, amount')
      .eq('nicepay_order_id', orderId)
      .single()

    if (!order) return new NextResponse('fail', { status: 404 })
    if (order.status !== 'paid_escrow') return new NextResponse('ok', { status: 200 })
    if (order.amount !== amount) return new NextResponse('fail', { status: 400 })

    // 이미 처리 완료 (paid_escrow = 가상계좌 입금 대기 상태이므로 이미 정상)
    return new NextResponse('ok', { status: 200 })
  } catch {
    return new NextResponse('fail', { status: 500 })
  }
}
