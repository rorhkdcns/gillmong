import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'

interface SaveItem {
  productId: number
  productName: string
  productPrice: number
  productImage: string
  productUrl: string
  tags: string[]
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { admin } = auth

  const body = await req.json().catch(() => null) as {
    items?: SaveItem[]
    shopCategoryId?: string | null
    shopSubcategoryId?: string | null
  } | null
  const items = body?.items ?? []
  // 상품관리 화면에서 카테고리/하위카테고리를 펼쳐놓은 채로 쿠팡 검색을 사용하면
  // 검색된 전체 배치에 그 컨텍스트를 그대로 적용한다(항목별 개별 지정 UI는 없음).
  const shopCategoryId = body?.shopCategoryId ?? null
  const shopSubcategoryId = body?.shopSubcategoryId ?? null
  if (items.length === 0) {
    return NextResponse.json({ error: '선택된 상품이 없습니다.' }, { status: 400 })
  }
  if (items.some((item) => (item.tags ?? []).length === 0)) {
    return NextResponse.json({ error: '태그가 없는 상품이 있습니다. 모든 상품에 태그를 입력해주세요.' }, { status: 400 })
  }

  // 이미 등록된 product_id는 건너뛴다 (같은 상품 중복 저장 방지).
  const requestedIds = items.map((item) => String(item.productId))
  const { data: existingRows, error: existingErr } = await admin
    .from('affiliate_products')
    .select('product_id')
    .in('product_id', requestedIds)
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }
  const existingIds = new Set((existingRows ?? []).map((r) => r.product_id))
  const newItems = items.filter((item) => !existingIds.has(String(item.productId)))
  const skipped = items.length - newItems.length

  if (newItems.length === 0) {
    return NextResponse.json({ success: true, saved: 0, skipped })
  }

  // ★ 쿠팡 상품검색 API는 productUrl을 이미 파트너스 추적 링크(link.coupang.com/re/AFFSDP?...)로
  //   반환한다 — 검색 자체가 이 계정의 access/secret key로 인증되기 때문. 여기에 딥링크 변환
  //   API(/v1/deeplink)를 한 번 더 태우면 "url convert failed"로 실패하는 경우가 잦고(원래
  //   변환용이 아닌, 이미 변환된 링크를 다시 넣는 것이라 발생), 실패해도 실제로는 productUrl
  //   자체가 이미 정상 추적 링크라 재변환이 아무 의미가 없었다. 그래서 productUrl을 그대로 저장한다.
  const { data: maxRow } = await admin
    .from('affiliate_products')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  let nextSortOrder = (maxRow?.sort_order ?? 0) + 1

  const rows = newItems.map((item) => ({
    title: item.productName,
    price_text: Number.isFinite(item.productPrice) ? `${item.productPrice.toLocaleString()}원` : null,
    image_url: item.productImage || null,
    link_url: item.productUrl,
    tags: item.tags,
    sort_order: nextSortOrder++,
    is_active: true,
    coupang_product_id: String(item.productId),
    product_id: String(item.productId),
    last_checked_at: new Date().toISOString(),
    shop_category_id: shopCategoryId,
    shop_subcategory_id: shopSubcategoryId,
  }))

  const { error } = await admin.from('affiliate_products').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, saved: rows.length, skipped })
}
