import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Subcategory {
  slug: string
  name: string
  parent_slug: string
  description: string | null
  sort_order: number
  has_public_page: boolean
  is_active: boolean
}

/**
 * 공개 페이지를 가질 수 있는 소분류만 반환.
 * has_public_page=true AND is_active=true 이면서, 발행된 글이 3개 이상인 소분류만 통과시킨다.
 * (글 1~2개짜리 얇은 페이지가 대량 생기는 것을 막기 위함)
 * 메뉴/목록/사이트맵/브레드크럼 링크 판정에서 전부 이 함수를 공통으로 써야 한다.
 * ★ 이 캐시를 쓰는 라우트(사전 대분류/소분류 페이지, sitemap.xml)의 실제 revalidate는
 *   "그 페이지의 revalidate와 이 값 중 더 짧은 쪽"으로 결정되므로, 여기 값을 짧게 두면
 *   페이지별로 더 길게 잡은 revalidate가 전부 이 값으로 강제된다.
 *   사전 소분류 관리가 지금은 SQL로만 이뤄져 즉시 반영 요구가 없으므로 넉넉하게 잡아둔다.
 */
export const getVisibleSubcategories = unstable_cache(
  async (): Promise<Subcategory[]> => {
    const admin = createAdminClient()

    const { data: subcats } = await admin
      .from('dictionary_subcategories')
      .select('slug, name, parent_slug, description, sort_order, has_public_page, is_active')
      .eq('has_public_page', true)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (!subcats || subcats.length === 0) return []

    const slugs = subcats.map((s) => s.slug)
    const { data: entries } = await admin
      .from('dictionary_entries')
      .select('subcategory_slug')
      .eq('is_published', true)
      .in('subcategory_slug', slugs)

    const counts: Record<string, number> = {}
    for (const e of entries ?? []) {
      if (!e.subcategory_slug) continue
      counts[e.subcategory_slug] = (counts[e.subcategory_slug] ?? 0) + 1
    }

    return subcats.filter((s) => (counts[s.slug] ?? 0) >= 3)
  },
  ['visible-dictionary-subcategories'],
  { revalidate: 3600 },
)
