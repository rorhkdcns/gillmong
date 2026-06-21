import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment } from '@/lib/nicepay'
import { NextRequest, NextResponse } from 'next/server'

// NicePay 서버-투-서버 웹훅 (notifyUrl)
// confirm/route.ts에서 1차 처리되므로 여기서는 멱등적으로 보완 처리
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    let tid = '', orderId = '', amount = 0, authResultCode = ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text   = await req.text()
      const params = new URLSearchParams(text)
      tid            = params.get('tid')            ?? ''
      orderId        = params.get('orderId')        ?? ''
      amount         = Number(params.get('amount'))
      authResultCode = params.get('authResultCode') ?? params.get('resultCode') ?? ''
    } else {
      const body = await req.json()
      tid            = body.tid            ?? ''
      orderId        = body.orderId        ?? ''
      amount         = Number(body.amount)
      authResultCode = body.authResultCode ?? body.resultCode ?? body.status ?? ''
    }

    if (!orderId) return NextResponse.json({ ok: false }, { status: 400 })

    const admin = createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('user_id, status')
      .eq('order_id', orderId)
      .single()

    if (!payment)                    return NextResponse.json({ ok: false }, { status: 404 })
    if (payment.status === 'completed') return NextResponse.json({ ok: true })

    const isSuccess = authResultCode === '0000' || authResultCode === 'paid' || authResultCode === 'success'

    if (!isSuccess) {
      await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
      return NextResponse.json({ ok: true })
    }

    // 아직 승인 안 된 경우 승인 시도
    if (tid) {
      const approval = await approveNicepayPayment(tid, amount)
      if (approval.resultCode !== '0000') {
        await admin.from('payments').update({ status: 'failed' }).eq('order_id', orderId)
        return NextResponse.json({ ok: true })
      }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('points')
      .eq('id', payment.user_id)
      .single()

    const newPoints = (profile?.points ?? 0) + amount

    await Promise.all([
      admin.from('payments').update({
        status:       'completed',
        payment_id:   tid || null,
        completed_at: new Date().toISOString(),
      }).eq('order_id', orderId),
      admin.from('profiles').update({ points: newPoints }).eq('id', payment.user_id),
      admin.from('point_logs').insert({
        user_id:     payment.user_id,
        amount:      amount,
        type:        'charge',
        description: `포인트 충전 (주문 ${orderId})`,
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
