import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'
import { searchProducts, SEARCH_LIMIT_DEFAULT } from '@/lib/coupang'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null) as { keyword?: string; limit?: number } | null
  const keyword = body?.keyword?.trim()
  if (!keyword) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 })
  }
  // 실제 clamp는 searchProducts -> clampSearchLimit()에서 처리. 여기서는 미전달 시 기본값만 채움.
  const limit = body?.limit ?? SEARCH_LIMIT_DEFAULT

  const result = await searchProducts(keyword, limit)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ products: result.data })
}
