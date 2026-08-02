import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'
import { createDeeplink } from '@/lib/coupang'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { admin } = auth

  const body = await req.json().catch(() => null) as { id?: string } | null
  const id = body?.id
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  const { data: product } = await admin
    .from('affiliate_products')
    .select('link_url')
    .eq('id', id)
    .single()

  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })
  }

  // deeplink_failed 상태에서는 link_url이 곧 원본(미변환) 상품 URL이므로 그대로 재시도한다.
  const deeplinkResult = await createDeeplink([product.link_url])
  const converted = deeplinkResult.ok ? deeplinkResult.data[0] : undefined

  if (!converted) {
    const error = deeplinkResult.ok ? '딥링크 변환에 실패했습니다.' : deeplinkResult.error
    return NextResponse.json({ error }, { status: 502 })
  }

  const { error } = await admin
    .from('affiliate_products')
    .update({ link_url: converted.shortenUrl, deeplink_failed: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
