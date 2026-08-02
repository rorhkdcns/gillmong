import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { searchProducts } from '@/lib/coupang'

const BATCH_SIZE = 50
const DELAY_MS = 300 // 쿠팡 API 호출량 제한 회피용 딜레이

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/cron/affiliate-health
// Vercel Cron이 매일 새벽 2시(KST) 호출
// 활성 제휴상품을 오래된 순으로 재조회해 품절/판매중지 상품을 자동 비활성화
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: targets, error } = await admin
    .from('affiliate_products')
    .select('id, title, price_text, product_id')
    .eq('is_active', true)
    .not('product_id', 'is', null)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[AffiliateHealth] 조회 오류:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!targets || targets.length === 0) {
    return NextResponse.json({ checked: 0, deactivated: 0, message: '대상 없음' })
  }

  const now = new Date().toISOString()
  let checked = 0
  let deactivated = 0

  for (const product of targets) {
    if (checked > 0) await sleep(DELAY_MS)
    checked++

    const result = await searchProducts(product.title, 20)
    if (!result.ok) {
      console.error('[AffiliateHealth] 검색 실패, 다음 회차에 재시도:', product.id, result.error)
      continue
    }

    const match = result.data.find((p) => String(p.productId) === product.product_id)

    if (!match) {
      await admin.from('affiliate_products').update({
        is_active: false,
        deactivated_reason: '검색 결과에서 확인되지 않음 (품절/판매중지 추정)',
        deactivated_at: now,
        last_checked_at: now,
      }).eq('id', product.id)
      deactivated++
      continue
    }

    const updates: { last_checked_at: string; price_text?: string } = { last_checked_at: now }
    const newPriceText = `${match.productPrice.toLocaleString()}원`
    if (newPriceText !== product.price_text) updates.price_text = newPriceText
    await admin.from('affiliate_products').update(updates).eq('id', product.id)
  }

  console.log(`[AffiliateHealth] 완료: ${checked}건 확인, ${deactivated}건 비활성화`)
  return NextResponse.json({ checked, deactivated, total: targets.length })
}
