import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories } from '@/lib/categories'
import { getVisibleSubcategories } from '@/lib/dictionary'
import SiteFooter from '@/components/SiteFooter'
import DictionaryFilterList, { type DictionaryFilterEntry } from '../../_components/DictionaryFilterList'

const BLOCK_SHAPE = 'rounded-[14px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] p-[20px_18px] md:p-[26px_24px]'

async function getSubcategoryEntries(subSlug: string): Promise<DictionaryFilterEntry[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary, tags')
    .eq('is_published', true)
    .eq('subcategory_slug', subSlug)
    .order('keyword', { ascending: true })
  return data ?? []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; sub: string }>
}): Promise<Metadata> {
  const { category, sub } = await params

  const visibleSubs = await getVisibleSubcategories()
  const subcategory = visibleSubs.find((s) => s.slug === sub && s.parent_slug === category)
  if (!subcategory) return {}

  const title = `${subcategory.name} 꿈 해몽 - 길몽상점`
  const description = subcategory.description ?? `${subcategory.name}에 관한 꿈 해몽을 모아봤습니다.`

  return { title, description, openGraph: { title, description } }
}

export const revalidate = 300

export default async function DictionarySubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; sub: string }>
}) {
  const { category, sub } = await params

  const [categories, visibleSubs] = await Promise.all([
    getActiveCategories(),
    getVisibleSubcategories(),
  ])
  const parentCategory = categories.find((c) => c.slug === category)
  if (!parentCategory) notFound()

  const subcategory = visibleSubs.find((s) => s.slug === sub && s.parent_slug === category)
  if (!subcategory) notFound()

  const entries = await getSubcategoryEntries(sub)
  const siblingSubs = visibleSubs.filter((s) => s.parent_slug === category && s.slug !== sub)

  return (
    <div className="flex min-h-screen flex-col">

      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[600px] flex-col gap-[14px]">

          {/* 헤더 블록 */}
          <div className={`${BLOCK_SHAPE} bg-white`}>
            <nav className="mb-2 text-sm text-[#5C6E7C]">
              <Link href="/dictionary" className="hover:text-[#2E7DD1]">해몽 사전</Link>
              <span className="mx-1.5">›</span>
              <Link href={`/dictionary/${parentCategory.slug}`} className="hover:text-[#2E7DD1]">
                {parentCategory.name}
              </Link>
              <span className="mx-1.5">›</span>
              <span>{subcategory.name}</span>
            </nav>
            <h1 className="mb-2 text-[26px] font-medium text-[#0B2433] md:text-[32px]">{subcategory.name} 꿈 해몽</h1>
            <p className="text-[15px] text-[#5C6E7C]">
              {subcategory.description ?? `${subcategory.name}에 관한 꿈 키워드를 모아봤습니다.`}
            </p>
          </div>

          {/* 전체 글 목록 */}
          <DictionaryFilterList entries={entries} />

          {/* 같은 대분류의 다른 소분류 */}
          {siblingSubs.length > 0 && (
            <div className={`${BLOCK_SHAPE} bg-white`}>
              <h2 className="mb-3 text-sm font-bold text-[#5C6E7C]">{parentCategory.name}의 다른 소분류</h2>
              <div className="flex flex-wrap gap-2">
                {siblingSubs.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/dictionary/${category}/${s.slug}`}
                    className="rounded-full border border-[#DCE5EB] bg-white px-4 py-2 text-sm font-medium text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                  >
                    {s.name}
                  </Link>
                ))}
                <Link
                  href={`/dictionary/${category}`}
                  className="rounded-full border border-[#DCE5EB] bg-white px-4 py-2 text-sm font-medium text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                >
                  {parentCategory.name} 전체 보기
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
