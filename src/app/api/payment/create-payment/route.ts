import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderId } from '@/lib/nicepay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, paymentMethod = 'card', cardQuota } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('nickname, username, email, phone')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    const orderId = generateOrderId()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

    const { error: insertError } = await admin.from('payments').insert({
      user_id:        userId,
      order_id:       orderId,
      amount:         Math.floor(amount),
      status:         'pending',
      payment_method: paymentMethod,
    })

    if (insertError) {
      return NextResponse.json({ error: '결제 준비 실패' }, { status: 500 })
    }

    // 결제수단별 추가 파라미터
    const extra: Record<string, unknown> = {}

    if (paymentMethod === 'card' && cardQuota) {
      extra.cardQuota = cardQuota   // '00:02:03:06:12'
    }
    if (paymentMethod === 'vbank') {
      extra.vbankHolder     = '길몽상점'
      extra.vbankValidHours = 72
    }
    if (paymentMethod === 'cellphone') {
      extra.isDigital = true
    }

    return NextResponse.json({
      success:       true,
      orderId,
      clientId:      process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID,
      amount:        Math.floor(amount),
      goodsName:     '길몽상점 포인트 충전',
      buyerName:     profile.nickname || profile.username || '길몽상점 사용자',
      buyerTel:      (profile.phone ?? '').replace(/-/g, '') || '01000000000',
      buyerEmail:    profile.email || '',
      returnUrl:     `${siteUrl}/api/payment/callback`,
      notifyUrl:     `${siteUrl}/api/payment/vbank-notify`,
      paymentMethod,
      ...extra,
    })
  } catch {
    return NextResponse.json({ error: '결제 요청 중 오류 발생' }, { status: 500 })
  }
}
