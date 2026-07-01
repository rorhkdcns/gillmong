import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveNicepayPayment, verifyNicepaySignature } from '@/lib/nicepay'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

// NicePay 꿈 구매 인증 후 POST (application/x-www-form-urlencoded)
export async function POST(req: NextRequest) {
  const text   = await req.text()
  const params = new URLSearchParams(text)

  const authResultCode = params.get('authResultCode') ?? ''
  const authResultMsg  = params.get('authResultMsg')  ?? ''
  const tid            = params.get('tid')            ?? ''
  const orderId        = params.get('orderId')        ?? ''
  const amount         = Number(params.get('amount'))
  const authToken      = params.get('authToken')      ?? ''
  const signature      = params.get('signature')      ?? ''

  console.log('[OrderCallback] 수신:', { authResultCode, orderId, amount })

  const admin = createAdminClient()

  if (!orderId || !amount) {
    console.error('[OrderCallback] 필수값 누락')
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 주문 조회
  const { data: order } = await admin
    .from('orders')
    .select('id, buyer_id, seller_id, dream_id, amount, seller_amount, status')
    .eq('nicepay_order_id', orderId)
    .single()

  if (!order) {
    console.error('[OrderCallback] 주문 없음:', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  if (order.status !== 'pending') {
    // 이미 처리된 주문
    return NextResponse.redirect(`${SITE}/purchase/success?dreamId=${order.dream_id}`, { status: 302 })
  }

  // 인증 실패 (사용자 취소 포함)
  if (authResultCode !== '0000') {
    console.error('[OrderCallback] 인증 실패:', authResultCode, authResultMsg)
    await admin.from('orders').delete().eq('nicepay_order_id', orderId)
    return NextResponse.redirect(`${SITE}/dream/${order.dream_id}`, { status: 302 })
  }

  // 위변조 검증
  if (!verifyNicepaySignature(authToken, amount, signature)) {
    console.error('[OrderCallback] 위변조 감지:', orderId)
    await admin.from('orders').delete().eq('nicepay_order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // 금액 위변조 검증
  if (order.amount !== amount) {
    console.error('[OrderCallback] 금액 불일치:', { order: order.amount, received: amount })
    await admin.from('orders').delete().eq('nicepay_order_id', orderId)
    return NextResponse.redirect(`${SITE}/mypage`, { status: 302 })
  }

  // NicePay 승인 API 호출
  let approval: Awaited<ReturnType<typeof approveNicepayPayment>>
  try {
    approval = await approveNicepayPayment(tid, amount)
    console.log('[OrderCallback] 승인 결과:', approval.resultCode, approval.resultMsg)
  } catch (err) {
    console.error('[OrderCallback] 승인 API 오류:', err)
    await admin.from('orders').delete().eq('nicepay_order_id', orderId)
    return NextResponse.redirect(`${SITE}/dream/${order.dream_id}`, { status: 302 })
  }

  if (approval.resultCode !== '0000') {
    console.error('[OrderCallback] 승인 실패:', approval.resultCode, approval.resultMsg)
    await admin.from('orders').delete().eq('nicepay_order_id', orderId)
    return NextResponse.redirect(`${SITE}/dream/${order.dream_id}`, { status: 302 })
  }

  // 가상계좌: 입금 대기
  if (approval.status === 'ready' && approval.vbank) {
    const v = approval.vbank
    const confirmDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await admin.from('orders').update({
      status:           'paid_escrow',
      nicepay_tid:      tid,
      paid_at:          new Date().toISOString(),
      confirm_deadline: confirmDeadline,
      updated_at:       new Date().toISOString(),
    }).eq('nicepay_order_id', orderId)

    // is_sold 선점 + purchases 삽입 (열람 권한 부여)
    await admin.from('dreams').update({ is_sold: true }).eq('id', order.dream_id).eq('is_sold', false)
    await admin.from('purchases').insert({ buyer_id: order.buyer_id, dream_id: order.dream_id, price: amount })

    const q = new URLSearchParams({
      dreamId:      String(order.dream_id),
      method:       'vbank',
      amount:       String(amount),
      vbankName:    v.vbankName,
      vbankNumber:  v.vbankNumber,
      vbankHolder:  v.vbankHolder,
      vbankExpDate: v.vbankExpDate,
    })
    return NextResponse.redirect(`${SITE}/purchase/success?${q}`, { status: 302 })
  }

  // 즉시 결제 완료 (카드/간편결제)
  const confirmDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await Promise.all([
    admin.from('orders').update({
      status:           'paid_escrow',
      nicepay_tid:      tid,
      paid_at:          new Date().toISOString(),
      confirm_deadline: confirmDeadline,
      updated_at:       new Date().toISOString(),
    }).eq('nicepay_order_id', orderId),
    admin.from('dreams').update({ is_sold: true }).eq('id', order.dream_id).eq('is_sold', false),
    admin.from('purchases').insert({ buyer_id: order.buyer_id, dream_id: order.dream_id, price: amount }),
  ])

  console.log('[OrderCallback] 완료:', orderId)
  return NextResponse.redirect(`${SITE}/purchase/success?dreamId=${order.dream_id}&amount=${amount}`, { status: 302 })
}
