import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderId } from '@/lib/nicepay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, amount } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. 사용자 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, username')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    // 2. 주문 ID 생성
    const orderId = generateOrderId()

    // 3. 임시 결제 기록 저장
    const { error: insertError } = await supabase.from('payments').insert({
      user_id:    userId,
      order_id:   orderId,
      amount:     Math.floor(amount),
      status:     'pending',
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('결제 기록 저장 실패:', insertError)
      return NextResponse.json({ error: '결제 준비 실패' }, { status: 500 })
    }

    // 4. NicePay 결제에 필요한 정보 반환
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'
    return NextResponse.json({
      success:   true,
      orderId,
      clientId:  process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID,
      amount:    Math.floor(amount),
      goodsName: '길몽상점 포인트 충전',
      buyerName: profile.nickname || profile.username || '길몽상점 사용자',
      buyerTel:  '010-0000-0000',
      returnUrl: `${siteUrl}/api/payment/confirm`,
    })
  } catch (error) {
    console.error('결제 요청 실패:', error)
    return NextResponse.json({ error: '결제 요청 중 오류 발생' }, { status: 500 })
  }
}
