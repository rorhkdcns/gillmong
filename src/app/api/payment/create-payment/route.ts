import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderId } from '@/lib/nicepay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, paymentMethod = 'card' } = await req.json()
    console.log('[CreatePayment] 요청:', { userId, amount, paymentMethod })

    if (!userId || !amount) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('nickname, username, email')
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
      console.error('[CreatePayment] DB 삽입 실패:', insertError)
      return NextResponse.json({ error: '결제 준비 실패' }, { status: 500 })
    }

    const result = {
      orderId,
      amount:     Math.floor(amount),
      goodsName:  '길몽상점 포인트',
      returnUrl:  `${siteUrl}/api/payment/callback`,
      buyerName:  profile.nickname || profile.username || '길몽상점 사용자',
      buyerEmail: profile.email || '',
    }

    console.log('[CreatePayment] 완료:', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[CreatePayment] 오류:', err)
    return NextResponse.json({ error: '결제 요청 중 오류 발생' }, { status: 500 })
  }
}
