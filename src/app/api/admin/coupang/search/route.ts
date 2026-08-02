import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { searchProducts } from '@/lib/coupang'

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
