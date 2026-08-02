import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'
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
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { admin } = auth

  const body = await req.json().catch(() => null) as { items?: SaveItem[] } | null
  const items = body?.items ?? []
  if (items.length === 0) {
    return NextResponse.json({ error: '선택된 상품이 없습니다.' }, { status: 400 })
  }

  // 딥링크 변환 (선택한 상품 URL을 한 번에 변환)
  // ★ 변환이 전체 실패하거나 일부 URL만 실패해도 저장 자체는 막지 않는다 —
  //   실패한 상품은 원본 URL(추적 안 되는 링크)로 저장하고 deeplink_failed로 표시,
  //   나중에 어드민에서 개별 재변환할 수 있게 한다.
  const deeplinkResult = await createDeeplink(items.map((item) => item.productUrl))
  if (!deeplinkResult.ok) {
    console.error('[coupang] 딥링크 변환 전체 실패, 원본 URL로 폴백', { error: deeplinkResult.error })
  }
  const shortenUrlByOriginal = new Map(
    deeplinkResult.ok ? deeplinkResult.data.map((link) => [link.originalUrl, link.shortenUrl]) : []
  )

  // 기존 sort_order 뒤에 이어 붙임 (기존 순서를 밀어내지 않도록)
  const { data: maxRow } = await admin
    .from('affiliate_products')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  let nextSortOrder = (maxRow?.sort_order ?? 0) + 1

  const rows = items.map((item) => {
    const shortenUrl = shortenUrlByOriginal.get(item.productUrl)
    return {
      title: item.productName,
      price_text: Number.isFinite(item.productPrice) ? `${item.productPrice.toLocaleString()}원` : null,
      image_url: item.productImage || null,
      link_url: shortenUrl ?? item.productUrl,
      deeplink_failed: !shortenUrl,
      tags: item.tags ?? [],
      sort_order: nextSortOrder++,
      is_active: true,
      coupang_product_id: String(item.productId),
      product_id: String(item.productId),
      last_checked_at: new Date().toISOString(),
    }
  })

  const { error } = await admin.from('affiliate_products').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const deeplinkFailedCount = rows.filter((r) => r.deeplink_failed).length
  return NextResponse.json({ success: true, saved: rows.length, deeplinkFailedCount })
}
