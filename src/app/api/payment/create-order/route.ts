import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateOrderId } from '@/lib/nicepay'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/payment/create-order
// body: { dreamId, paymentMethod }
export async function POST(req: NextRequest) {
  try {
    const { dreamId, paymentMethod = 'card' } = await req.json()

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    if (!dreamId) return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })

    const admin = createAdminClient()

    const [{ data: dream }, { data: profile }] = await Promise.all([
      admin.from('dreams').select('id, title, price, user_id, is_sold').eq('id', dreamId).single(),
      admin.from('profiles').select('nickname, username, email').eq('id', user.id).single(),
    ])

    if (!dream) return NextResponse.json({ error: '존재하지 않는 꿈입니다' }, { status: 404 })
    if (dream.is_sold) return NextResponse.json({ error: '이미 판매된 꿈입니다' }, { status: 400 })
    if (dream.user_id === user.id) return NextResponse.json({ error: '본인의 꿈은 구매할 수 없습니다' }, { status: 400 })

    const { data: existing } = await admin
      .from('purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('dream_id', dreamId)
      .single()
    if (existing) return NextResponse.json({ error: '이미 구매한 꿈입니다' }, { status: 400 })

    const orderId = generateOrderId()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gillmong.com'

    // 에스크로 주문 임시 기록 (결제 전 pending → 콜백에서 paid_escrow로 변경)
    const { error: insertErr } = await admin.from('orders').insert({
      buyer_id:         user.id,
      seller_id:        dream.user_id,
      dream_id:         dream.id,
      amount:           dream.price,
      seller_amount:    Math.floor(dream.price * 0.8),
      payment_method:   paymentMethod,
      nicepay_order_id: orderId,
      status:           'pending',
    })

    if (insertErr) {
      console.error('[CreateOrder] DB 삽입 실패:', insertErr)
      return NextResponse.json({ error: '주문 준비 실패' }, { status: 500 })
    }

    return NextResponse.json({
      orderId,
      amount:     dream.price,
      goodsName:  `[길몽상점] ${dream.title}`,
      returnUrl:  `${siteUrl}/api/payment/order-callback`,
      buyerName:  profile?.nickname || profile?.username || '길몽상점 사용자',
      buyerEmail: profile?.email || '',
      dreamId:    dream.id,
    })
  } catch (err) {
    console.error('[CreateOrder] 오류:', err)
    return NextResponse.json({ error: '주문 요청 중 오류 발생' }, { status: 500 })
  }
}
