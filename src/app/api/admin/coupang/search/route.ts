import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/adminAuth'
import { searchProducts } from '@/lib/coupang'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null) as { keyword?: string; limit?: number } | null
  const keyword = body?.keyword?.trim()
  if (!keyword) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 })
  }
  const limit = body?.limit && body.limit > 0 && body.limit <= 50 ? body.limit : 20

  const result = await searchProducts(keyword, limit)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ products: result.data })
}
