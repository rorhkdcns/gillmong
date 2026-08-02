import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'
import { searchProducts, SEARCH_LIMIT_DEFAULT, type CoupangProduct } from '@/lib/coupang'

// 쿠팡 검색 API는 페이지네이션 파라미터(page/offset 등)를 제공하지 않는다
// (공식 문서·커뮤니티 SDK 어디에도 없음, limit도 1~10로 작음) — 대신 쉼표로 구분한
// 검색어 여러 개를 순차 검색해 결과를 합치는 방식으로 결과 수를 늘린다.
const KEYWORD_SEARCH_DELAY_MS = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null) as { keyword?: string; limit?: number } | null
  const keywords = (body?.keyword ?? '').split(',').map((k) => k.trim()).filter(Boolean)
  if (keywords.length === 0) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 })
  }
  // 실제 clamp는 searchProducts -> clampSearchLimit()에서 처리. 여기서는 미전달 시 기본값만 채움.
  const limit = body?.limit ?? SEARCH_LIMIT_DEFAULT

  const merged: CoupangProduct[] = []
  const seenIds = new Set<number>()
  const errors: string[] = []

  for (let i = 0; i < keywords.length; i++) {
    if (i > 0) await sleep(KEYWORD_SEARCH_DELAY_MS)

    const result = await searchProducts(keywords[i], limit)
    if (!result.ok) {
      console.error('[coupang] 다중 검색어 중 일부 실패', { keyword: keywords[i], error: result.error })
      errors.push(`${keywords[i]}: ${result.error}`)
      continue
    }
    for (const product of result.data) {
      if (seenIds.has(product.productId)) continue
      seenIds.add(product.productId)
      merged.push(product)
    }
  }

  if (merged.length === 0) {
    return NextResponse.json({ error: errors[0] ?? '검색 결과가 없습니다.' }, { status: 502 })
  }

  return NextResponse.json({ products: merged })
}
