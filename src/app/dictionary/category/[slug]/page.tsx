import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories } from '@/lib/categories'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

interface DictEntry {
  slug: string
  keyword: string
  summary: string
}

const getCategoryEntries = cache(async (categorySlug: string): Promise<DictEntry[]> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary')
    .eq('is_published', true)
    .eq('category_slug', categorySlug)
    .order('keyword', { ascending: true })
  return data ?? []
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const categories = await getActiveCategories()
  const category = categories.find((c) => c.slug === slug)
  if (!category) return {}

  const entries = await getCategoryEntries(slug)
  const keywordList = entries.slice(0, 8).map((e) => e.keyword).join(', ')
  const baseDesc = category.description ?? `${category.name}에 관한 꿈 해몽`
  const description = keywordList ? `${baseDesc} — ${keywordList} 등의 해몽을 확인해보세요.` : baseDesc

  const title = `${category.name} 꿈 해몽 - 길몽상점`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export const dynamic = 'force-dynamic'

export default async function DictionaryCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const categories = await getActiveCategories()
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  const entries = await getCategoryEntries(slug)
  const otherCategories = categories.filter((c) => c.slug !== slug)

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <SiteHeader />

      <section className="bg-white px-6 pb-6 pt-14 text-center">
        <nav className="mb-3 text-sm text-brand-ink-soft">
          <Link href="/dictionary" className="hover:text-brand-violet-deep">해몽 사전</Link>
          <span className="mx-1.5">›</span>
          <span>{category.name}</span>
        </nav>
        <h1 className="mb-3 text-4xl text-brand-ink">{category.name} 꿈 해몽</h1>
        <p className="mb-6 text-base text-brand-ink-soft">
          {category.description ?? `${category.name}에 관한 꿈 키워드를 모아봤습니다.`}
        </p>
        <div className="mx-auto max-w-6xl border-b border-brand-line" />
      </section>

      <section className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {entries.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              아직 이 카테고리에 등록된 사전 항목이 없습니다.
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

          {/* 다른 카테고리 */}
          {otherCategories.length > 0 && (
            <div className="mt-14 border-t border-brand-line pt-8">
              <h2 className="mb-3 text-sm font-bold text-brand-muted">다른 카테고리 둘러보기</h2>
              <div className="flex flex-wrap gap-2">
                {otherCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/dictionary/category/${c.slug}`}
                    className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink-soft transition-colors hover:border-brand-violet hover:text-brand-violet-deep"
                  >
                    {c.name} 해몽
                  </Link>
                ))}
                <Link
                  href="/dictionary"
                  className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink-soft transition-colors hover:border-brand-violet hover:text-brand-violet-deep"
                >
                  전체 사전 보기
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
