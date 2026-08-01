import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories } from '@/lib/categories'
import { getVisibleSubcategories } from '@/lib/dictionary'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

interface ListEntry {
  slug: string
  keyword: string
  summary: string
}

async function getSubcategoryEntries(subSlug: string): Promise<ListEntry[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary')
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

export const dynamic = 'force-dynamic'

export default async function DictionarySubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; sub: string }>
}) {
  const { category, sub } = await params

  const categories = await getActiveCategories()
  const parentCategory = categories.find((c) => c.slug === category)
  if (!parentCategory) notFound()

  const visibleSubs = await getVisibleSubcategories()
  const subcategory = visibleSubs.find((s) => s.slug === sub && s.parent_slug === category)
  if (!subcategory) notFound()

  const entries = await getSubcategoryEntries(sub)
  const siblingSubs = visibleSubs.filter((s) => s.parent_slug === category && s.slug !== sub)

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <SiteHeader />

      <section className="bg-white px-6 pb-6 pt-14 text-center">
        <nav className="mb-3 text-sm text-brand-ink-soft">
          <Link href="/dictionary" className="hover:text-brand-violet-deep">해몽 사전</Link>
          <span className="mx-1.5">›</span>
          <Link href={`/dictionary/${parentCategory.slug}`} className="hover:text-brand-violet-deep">
            {parentCategory.name}
          </Link>
          <span className="mx-1.5">›</span>
          <span>{subcategory.name}</span>
        </nav>
        <h1 className="mb-3 text-4xl text-brand-ink">{subcategory.name} 꿈 해몽</h1>
        <p className="mb-6 text-base text-brand-ink-soft">
          {subcategory.description ?? `${subcategory.name}에 관한 꿈 키워드를 모아봤습니다.`}
        </p>
        <div className="mx-auto max-w-6xl border-b border-brand-line" />
      </section>

      <section className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {entries.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              아직 이 소분류에 등록된 사전 항목이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {entries.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/dictionary/${entry.slug}`}
                  className="flex flex-col rounded-xl border border-brand-line bg-white p-4 shadow-sm transition-shadow hover:shadow-[0_14px_28px_rgba(11,36,51,0.1)]"
                >
                  <h3 className="mb-1.5 text-base font-bold text-brand-ink">{entry.keyword} 해몽</h3>
                  <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-brand-ink-soft">
                    {entry.summary}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* 같은 대분류의 다른 소분류 */}
          {siblingSubs.length > 0 && (
            <div className="mt-14 border-t border-brand-line pt-8">
              <h2 className="mb-3 text-sm font-bold text-brand-muted">{parentCategory.name}의 다른 소분류</h2>
              <div className="flex flex-wrap gap-2">
                {siblingSubs.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/dictionary/${category}/${s.slug}`}
                    className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink-soft transition-colors hover:border-brand-violet hover:text-brand-violet-deep"
                  >
                    {s.name}
                  </Link>
                ))}
                <Link
                  href={`/dictionary/${category}`}
                  className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink-soft transition-colors hover:border-brand-violet hover:text-brand-violet-deep"
                >
                  {parentCategory.name} 전체 보기
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
