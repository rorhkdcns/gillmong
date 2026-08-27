import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'
import { searchProducts, SEARCH_LIMIT_DEFAULT, type CoupangProduct } from '@/lib/coupang'

// 쿠팡 검색 API는 페이지네이션 파라미터(page/offset 등)를 제공하지 않는다
// (공식 문서·커뮤니티 SDK 어디에도 없음, limit도 1~10로 작음) — 대신 쉼표로 구분한
// 검색어 여러 개를 순차 검색해 결과를 합치는 방식으로 결과 수를 늘린다.
const KEYWORD_SEARCH_DELAY_MS = 5000
// 한 번의 검색 요청에서 처리할 최대 키워드 수. 계정 정지 재발 방지를 위한 상한.
const MAX_KEYWORDS = 5
// 같은 관리자가 연속으로 검색을 남발하지 못하게 두는 쿨다운.
const SEARCH_COOLDOWN_MS = 60_000

// 관리자별 마지막 검색 시각 (서버 메모리 — 인스턴스 재시작/스케일아웃 시 초기화되는
// best-effort 안전장치이며, 완벽한 분산 rate limit이 필요하면 별도 저장소로 옮겨야 한다).
const lastSearchAtByAdmin = new Map<string, number>()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const now = Date.now()
  const lastAt = lastSearchAtByAdmin.get(auth.userId) ?? 0
  const remainingMs = SEARCH_COOLDOWN_MS - (now - lastAt)
  if (remainingMs > 0) {
    return NextResponse.json(
      { error: `너무 잦은 검색입니다. ${Math.ceil(remainingMs / 1000)}초 후 다시 시도해주세요.` },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null) as { keyword?: string; limit?: number } | null
  let keywords = (body?.keyword ?? '').split(',').map((k) => k.trim()).filter(Boolean)
  if (keywords.length === 0) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 })
  }
  let notice: string | undefined
  if (keywords.length > MAX_KEYWORDS) {
    keywords = keywords.slice(0, MAX_KEYWORDS)
    notice = '5개까지만 처리됩니다.'
  }
  // 실제 clamp는 searchProducts -> clampSearchLimit()에서 처리. 여기서는 미전달 시 기본값만 채움.
  const limit = body?.limit ?? SEARCH_LIMIT_DEFAULT

  // 쿨다운은 실제로 검색을 시작하는 시점부터 카운트한다 (검증 실패 요청은 소모하지 않음).
  lastSearchAtByAdmin.set(auth.userId, now)

  const merged: CoupangProduct[] = []
  const seenIds = new Set<number>()
  const errors: string[] = []

  for (let i = 0; i < keywords.length; i++) {
    if (i > 0) await sleep(KEYWORD_SEARCH_DELAY_MS)

    const result = await searchProducts(keywords[i], limit, `admin:search:${auth.userId}`)
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

  return NextResponse.json({ products: merged, ...(notice ? { notice } : {}) })
}
