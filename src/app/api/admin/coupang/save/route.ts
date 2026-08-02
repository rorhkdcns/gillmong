import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createDeeplink } from '@/lib/coupang'

interface SaveItem {
  productId: number
  productName: string
  productPrice: number
  productImage: string
  productUrl: string
  tags: string[]
}

export async function POST(req: NextRequest) {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 어드민 확인
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null) as { items?: SaveItem[] } | null
  const items = body?.items ?? []
  if (items.length === 0) {
    return NextResponse.json({ error: '선택된 상품이 없습니다.' }, { status: 400 })
  }

  // 딥링크 변환 (선택한 상품 URL을 한 번에 변환)
  const deeplinkResult = await createDeeplink(items.map((item) => item.productUrl))
  if (!deeplinkResult.ok) {
    return NextResponse.json({ error: `딥링크 변환 실패: ${deeplinkResult.error}` }, { status: 502 })
  }
  const shortenUrlByOriginal = new Map(deeplinkResult.data.map((link) => [link.originalUrl, link.shortenUrl]))

  // 기존 sort_order 뒤에 이어 붙임 (기존 순서를 밀어내지 않도록)
  const { data: maxRow } = await admin
    .from('affiliate_products')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  let nextSortOrder = (maxRow?.sort_order ?? 0) + 1

  const rows = items.map((item) => ({
    title: item.productName,
    price_text: Number.isFinite(item.productPrice) ? `${item.productPrice.toLocaleString()}원` : null,
    image_url: item.productImage || null,
    link_url: shortenUrlByOriginal.get(item.productUrl) ?? item.productUrl,
    tags: item.tags ?? [],
    sort_order: nextSortOrder++,
    is_active: true,
    coupang_product_id: String(item.productId),
    product_id: String(item.productId),
    last_checked_at: new Date().toISOString(),
  }))

  const { error } = await admin.from('affiliate_products').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, saved: rows.length })
}
