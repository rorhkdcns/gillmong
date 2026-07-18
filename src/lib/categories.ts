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

/** 서버 컴포넌트용 — is_active=true 카테고리를 sort_order 순으로, 60초 캐시 */
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
  { revalidate: 60 }
)
