import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
}

/**
 * 서버 컴포넌트용 — is_active=true 카테고리를 sort_order 순으로, 1시간 캐시.
 * ★ 루트 layout.tsx가 모든 페이지를 감싸며 이 함수를 호출하기 때문에, 이 revalidate 값은
 *   사이트의 모든 라우트에서 "그 라우트 자체의 revalidate와 이 값 중 더 짧은 쪽"으로 적용된다.
 *   그래서 여기 값을 각 페이지의 revalidate보다 짧게 잡으면 페이지별 설정을 이 값이 덮어써버림
 *   (예: 60초로 뒀더니 /notice의 revalidate=600이 무시되고 60초로 강제된 적 있음).
 *   반드시 사이트에서 쓰는 가장 긴 페이지 revalidate 값 이상으로 유지할 것.
 *   관리자가 카테고리를 수정하면 revalidateTag('categories', 'max')로 즉시 무효화되므로
 *   캐시 기간을 길게 잡아도 반영 지연은 없다.
 */
export const getActiveCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('categories')
      .select('id, name, slug, description, sort_order, is_active')
      .eq('domain', 'dream')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return data ?? []
  },
  ['active-categories'],
  { revalidate: 3600, tags: ['categories'] }
)
