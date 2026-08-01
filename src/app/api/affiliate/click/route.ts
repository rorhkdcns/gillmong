import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let productId: string | undefined
  try {
    const body = await req.json()
    productId = body?.productId
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  if (!productId) {
    return NextResponse.json({ error: 'productId가 필요합니다.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: product } = await admin
    .from('affiliate_products')
    .select('click_count')
    .eq('id', productId)
    .single()

  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })
  }

  await admin
    .from('affiliate_products')
    .update({ click_count: (product.click_count ?? 0) + 1 })
    .eq('id', productId)

  return NextResponse.json({ success: true })
}
