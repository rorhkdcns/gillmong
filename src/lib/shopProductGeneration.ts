import { createAdminClient } from '@/lib/supabase/admin'
import { searchProducts } from '@/lib/coupang'
import { suggestTagsFromTitle } from '@/lib/autoTagProduct'

export interface ShopProductGenerationResult {
  newCount?: number
  skipCount?: number
  error?: string
}

// 쿠팡 검색 → 신규 상품 저장까지의 핵심 로직. admin 인증은 호출자 책임(관리자 서버 액션 /
// cron 라우트 양쪽에서 재사용). 중복 판별은 coupang_product_id 기준.
// product_id/coupang_product_id/last_checked_at도 함께 채워서 /api/cron/affiliate-health
// (product_id가 있는 상품만 자동 점검 대상으로 삼음)가 이후 정상적으로 점검할 수 있게 한다.
export async function runShopProductGeneration(
  categoryId: string, subcategoryId?: string,
): Promise<ShopProductGenerationResult> {
  const admin = createAdminClient()

  const { data: category, error: catErr } = await admin
    .from('shop_categories')
    .select('id, name, search_keyword')
    .eq('id', categoryId)
    .single()
  if (catErr || !category) return { error: catErr?.message ?? '카테고리를 찾을 수 없습니다.' }

  let subcategory: { name: string; search_keyword: string | null } | null = null
  if (subcategoryId) {
    const { data, error: subErr } = await admin
      .from('shop_subcategories')
      .select('name, search_keyword')
      .eq('id', subcategoryId)
      .single()
    if (subErr || !data) return { error: subErr?.message ?? '하위카테고리를 찾을 수 없습니다.' }
    subcategory = data
  }

  const keyword = subcategory
    ? (subcategory.search_keyword || subcategory.name)
    : (category.search_keyword || category.name)

  const result = await searchProducts(keyword, 10)
  if (!result.ok) return { error: result.error }

  const productIds = result.data.map((p) => String(p.productId))
  const existingIds = new Set<string>()
  if (productIds.length > 0) {
    const { data: existingRows, error: existingErr } = await admin
      .from('affiliate_products')
      .select('coupang_product_id')
      .in('coupang_product_id', productIds)
    if (existingErr) return { error: existingErr.message }
    for (const row of existingRows ?? []) {
      if (row.coupang_product_id) existingIds.add(row.coupang_product_id)
    }
  }

  const newProducts = result.data.filter((p) => !existingIds.has(String(p.productId)))
  const skipCount = result.data.length - newProducts.length

  if (newProducts.length > 0) {
    const { data: maxRow } = await admin
      .from('affiliate_products')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    let nextSortOrder = (maxRow?.sort_order ?? 0) + 1

    const now = new Date().toISOString()
    const rows = newProducts.map((p) => ({
      title: p.productName,
      price_text: Number.isFinite(p.productPrice) ? `${p.productPrice.toLocaleString()}원` : null,
      image_url: p.productImage || null,
      link_url: p.productUrl,
      tags: suggestTagsFromTitle(p.productName),
      sort_order: nextSortOrder++,
      is_active: true,
      is_rocket: p.isRocket ?? null,
      is_free_shipping: p.isFreeShipping ?? null,
      coupang_product_id: String(p.productId),
      product_id: String(p.productId),
      last_checked_at: now,
      shop_category_id: categoryId,
      shop_subcategory_id: subcategoryId ?? null,
    }))

    const { error: insertErr } = await admin.from('affiliate_products').insert(rows)
    if (insertErr) return { error: insertErr.message }
  }

  const nowIso = new Date().toISOString()
  if (subcategoryId) {
    await admin.from('shop_subcategories').update({ last_collected_at: nowIso }).eq('id', subcategoryId)
  } else {
    await admin.from('shop_categories').update({ last_collected_at: nowIso }).eq('id', categoryId)
  }

  return { newCount: newProducts.length, skipCount }
}

export interface ShopCollectionTarget {
  categoryId: string
  subcategoryId?: string
  lastCollectedAt: string | null
}

// 오늘 자동 수집할 대상을 고른다. 하위카테고리가 있는 카테고리는 하위카테고리 단위로,
// 없는 카테고리는 카테고리 자체를 대상으로 삼고, 전체를 last_collected_at 오름차순
// (한 번도 수집 안 한 대상이 최우선)으로 정렬해 상위 count개만 반환한다.
export async function pickShopCollectionTargets(count: number): Promise<ShopCollectionTarget[]> {
  const admin = createAdminClient()

  const { data: categories } = await admin
    .from('shop_categories')
    .select('id, last_collected_at')
    .eq('is_active', true)

  const { data: subcategories } = await admin
    .from('shop_subcategories')
    .select('id, category_id, last_collected_at')
    .eq('is_active', true)

  const subcategoriesByCategory = new Map<string, { id: string; last_collected_at: string | null }[]>()
  for (const sub of subcategories ?? []) {
    const list = subcategoriesByCategory.get(sub.category_id) ?? []
    list.push({ id: sub.id, last_collected_at: sub.last_collected_at })
    subcategoriesByCategory.set(sub.category_id, list)
  }

  const targets: ShopCollectionTarget[] = []
  for (const category of categories ?? []) {
    const subs = subcategoriesByCategory.get(category.id)
    if (subs && subs.length > 0) {
      for (const sub of subs) {
        targets.push({ categoryId: category.id, subcategoryId: sub.id, lastCollectedAt: sub.last_collected_at })
      }
    } else {
      targets.push({ categoryId: category.id, lastCollectedAt: category.last_collected_at })
    }
  }

  targets.sort((a, b) => {
    if (a.lastCollectedAt === b.lastCollectedAt) return 0
    if (a.lastCollectedAt === null) return -1
    if (b.lastCollectedAt === null) return 1
    return a.lastCollectedAt.localeCompare(b.lastCollectedAt)
  })

  return targets.slice(0, count)
}
