import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories, type Category } from '@/lib/categories'
import { getVisibleSubcategories, type Subcategory } from '@/lib/dictionary'
import { GRADE_INFO, type Grade } from '@/lib/dreamDisplay'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import AffiliateProducts from '@/components/AffiliateProducts'

// 이 라우트는 /dictionary/[category] 아래에서 "대분류 슬러그"와 "사전 항목 슬러그"를
// 함께 처리한다 (Next.js는 같은 레벨에 서로 다른 동적 세그먼트 이름을 허용하지 않기 때문에
// /dictionary/[category] 와 /dictionary/[slug] 를 별도 폴더로 분리할 수 없음).
// 먼저 대분류 slug인지 확인하고, 아니면 사전 항목 slug로 취급한다.

interface DictEntry {
  slug: string
  keyword: string
  summary: string
  body: string
  category_slug: string | null
  subcategory_slug: string | null
  tags: string[] | null
  is_published: boolean
}

interface ListEntry {
  slug: string
  keyword: string
  summary: string
}

const getEntry = cache(async (slug: string): Promise<DictEntry | null> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary, body, category_slug, subcategory_slug, tags, is_published')
    .eq('slug', slug)
    .single()
  return data
})

const getCategoryEntries = cache(async (categorySlug: string): Promise<ListEntry[]> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary')
    .eq('is_published', true)
    .eq('category_slug', categorySlug)
    .order('keyword', { ascending: true })
  return data ?? []
})

async function getRelatedEntries(
  admin: ReturnType<typeof createAdminClient>,
  entry: DictEntry,
  subcategory: Subcategory | null,
): Promise<ListEntry[]> {
  const results: ListEntry[] = []
  const seen = new Set([entry.slug])

  // 기타 소분류(has_public_page=false)는 진짜 소분류가 아니라 분류용 버킷이므로
  // 이걸로 관련 글을 찾지 않고 바로 대분류 기준으로 채운다.
  const isEtcBucket = subcategory ? !subcategory.has_public_page : false

  if (entry.subcategory_slug && !isEtcBucket) {
    const { data } = await admin
      .from('dictionary_entries')
      .select('slug, keyword, summary')
      .eq('subcategory_slug', entry.subcategory_slug)
      .eq('is_published', true)
      .neq('slug', entry.slug)
      .order('keyword', { ascending: true })
      .limit(5)
    for (const e of data ?? []) {
      if (seen.has(e.slug)) continue
      results.push(e)
      seen.add(e.slug)
    }
  }

  if (results.length < 5 && entry.category_slug) {
    const { data } = await admin
      .from('dictionary_entries')
      .select('slug, keyword, summary')
      .eq('category_slug', entry.category_slug)
      .eq('is_published', true)
      .neq('slug', entry.slug)
      .order('keyword', { ascending: true })
      .limit(10)
    for (const e of data ?? []) {
      if (seen.has(e.slug)) continue
      results.push(e)
      seen.add(e.slug)
      if (results.length >= 5) break
    }
  }

  return results
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params

  const categories = await getActiveCategories()
  const category = categories.find((c) => c.slug === slug)
  if (category) {
    const entries = await getCategoryEntries(slug)
    const keywordList = entries.slice(0, 8).map((e) => e.keyword).join(', ')
    const baseDesc = category.description ?? `${category.name}에 관한 꿈 해몽`
    const description = keywordList ? `${baseDesc} — ${keywordList} 등의 해몽을 확인해보세요.` : baseDesc
    const title = `${category.name} 꿈 해몽 - 길몽상점`
    return { title, description, openGraph: { title, description } }
  }

  const entry = await getEntry(slug)
  if (!entry || !entry.is_published) return {}

  const title = `${entry.keyword} 해몽 - 길몽상점`
  const description = entry.summary.slice(0, 150)
  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
  }
}

export const dynamic = 'force-dynamic'

export default async function DictionaryCategoryOrEntryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params

  const categories = await getActiveCategories()
  const category = categories.find((c) => c.slug === slug)
  if (category) {
    return <CategoryView category={category} allCategories={categories} />
  }

  const entry = await getEntry(slug)
  if (!entry || !entry.is_published) notFound()
  return <EntryView entry={entry} categories={categories} />
}

async function CategoryView({
  category,
  allCategories,
}: {
  category: Category
  allCategories: Category[]
}) {
  const [entries, visibleSubs] = await Promise.all([
    getCategoryEntries(category.slug),
    getVisibleSubcategories(),
  ])
  const subcategories = visibleSubs.filter((s) => s.parent_slug === category.slug)
  const otherCategories = allCategories.filter((c) => c.slug !== category.slug)

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

          {/* 소분류 */}
          {subcategories.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-3 text-sm font-bold text-brand-muted">세부 카테고리</h2>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/dictionary/${category.slug}/${s.slug}`}
                    className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink-soft transition-colors hover:border-brand-violet hover:text-brand-violet-deep"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 전체 글 목록 */}
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
                    href={`/dictionary/${c.slug}`}
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

async function EntryView({
  entry,
  categories,
}: {
  entry: DictEntry
  categories: Category[]
}) {
  const admin = createAdminClient()
  const slug = entry.slug

  // 조회수 증가
  const { data: viewRow } = await admin
    .from('dictionary_entries')
    .select('view_count')
    .eq('slug', slug)
    .single()
  if (viewRow) {
    await admin
      .from('dictionary_entries')
      .update({ view_count: (viewRow.view_count ?? 0) + 1 })
      .eq('slug', slug)
  }

  const category = entry.category_slug ? categories.find((c) => c.slug === entry.category_slug) : null
  const categoryName = category?.name ?? '기타'

  let subcategory: Subcategory | null = null
  if (entry.subcategory_slug) {
    const { data } = await admin
      .from('dictionary_subcategories')
      .select('slug, name, parent_slug, description, sort_order, has_public_page, is_active')
      .eq('slug', entry.subcategory_slug)
      .single()
    subcategory = data ?? null
  }

  const visibleSubs = await getVisibleSubcategories()
  const subcategoryIsLinkable = !!subcategory && visibleSubs.some((s) => s.slug === subcategory!.slug)

  const { data: relatedDreams } = entry.category_slug
    ? await admin
        .from('dreams')
        .select('id, title, grade, is_sold')
        .eq('category', entry.category_slug)
        .eq('is_adult', false)
        .order('created_at', { ascending: false })
        .limit(3)
    : { data: [] }

  const relatedEntries = await getRelatedEntries(admin, entry, subcategory)

  const bodyParagraphs = entry.body.split(/\n{2,}/).filter((p) => p.trim())

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <SiteHeader />

      <main className="flex-1 px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-3xl">

          {/* 브레드크럼 */}
          <nav className="mb-5 text-sm text-brand-ink-soft">
            <Link href="/dictionary" className="hover:text-brand-violet-deep">해몽 사전</Link>
            <span className="mx-1.5">›</span>
            {category ? (
              <Link href={`/dictionary/${category.slug}`} className="hover:text-brand-violet-deep">
                {categoryName}
              </Link>
            ) : (
              <span>{categoryName}</span>
            )}
            {subcategory && (
              <>
                <span className="mx-1.5">›</span>
                {subcategoryIsLinkable && category ? (
                  <Link href={`/dictionary/${category.slug}/${subcategory.slug}`} className="hover:text-brand-violet-deep">
                    {subcategory.name}
                  </Link>
                ) : (
                  <span>{subcategory.name}</span>
                )}
              </>
            )}
          </nav>

          <div className="rounded-2xl border border-brand-line bg-white p-6 md:p-10">

            {/* h1 */}
            <h1 className="mb-4 text-2xl font-black text-brand-heading md:text-3xl">
              {entry.keyword} 해몽
            </h1>

            {/* summary */}
            <p className="mb-5 text-base leading-relaxed text-brand-ink-soft">
              {entry.summary}
            </p>

            {/* 태그 */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-primary-light px-3 py-1 text-xs font-semibold text-brand-primary-hover"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <hr className="mb-6 border-brand-border" />

            {/* 본문 */}
            <div className="mb-8 space-y-4">
              {bodyParagraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line text-base leading-relaxed text-brand-body">
                  {p}
                </p>
              ))}
            </div>

            {/* AI 해몽 CTA */}
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-pink p-6 text-center text-white md:p-8">
              <p className="text-lg font-bold md:text-xl">내 꿈은 어떤 의미일까요?</p>
              <p className="mt-1.5 text-sm text-white/90">
                AI가 당신의 꿈을 직접 분석해드립니다. 지금 바로 무료로 감정받아보세요.
              </p>
              <Link
                href="/#appraisal"
                className="mt-4 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-brand-violet-deep transition-transform hover:scale-105"
              >
                AI 해몽 받으러 가기
              </Link>
            </div>

            {/* 제휴상품 */}
            <AffiliateProducts tags={entry.tags ?? []} />

            {/* 관련 거래중인 꿈 */}
            {relatedDreams && relatedDreams.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-heading">관련 거래중인 꿈</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {relatedDreams.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dream/${d.id}`}
                      className="flex flex-col gap-2 rounded-xl border border-brand-line bg-white p-4 transition-shadow hover:shadow-[0_14px_28px_rgba(11,36,51,0.1)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_INFO[d.grade as Grade]?.badgeBg ?? 'bg-gray-400'}`}>
                          {d.grade}
                        </span>
                        {d.is_sold ? (
                          <span className="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-bold text-white">판매완료</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">구매가능</span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm font-medium text-brand-ink">{d.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 같은 카테고리의 다른 해몽 */}
            {relatedEntries.length > 0 && (
              <section className="mt-8 border-t border-brand-line pt-8">
                <h2 className="mb-3 text-lg font-bold text-brand-heading">같은 카테고리의 다른 해몽</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {relatedEntries.map((e) => (
                    <Link
                      key={e.slug}
                      href={`/dictionary/${e.slug}`}
                      className="flex flex-col rounded-xl border border-brand-line bg-white p-4 transition-shadow hover:shadow-[0_14px_28px_rgba(11,36,51,0.1)]"
                    >
                      <h3 className="mb-1 text-sm font-bold text-brand-ink">{e.keyword} 해몽</h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-brand-ink-soft">{e.summary}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
