import { cache } from 'react'
import { after } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCategories, type Category } from '@/lib/categories'
import { getVisibleSubcategories, type Subcategory } from '@/lib/dictionary'
import { parseDictionaryBody, type DictionaryBodyBlock } from '@/lib/dictionaryBody'
import { getCategoryColor, type CategoryColorSet } from '@/lib/categoryColor'
import { GRADE_INFO, type Grade } from '@/lib/dreamDisplay'
import SiteFooter from '@/components/SiteFooter'
import AffiliateProducts from '@/components/AffiliateProducts'
import DictionaryFilterList, { type DictionaryFilterEntry } from '../_components/DictionaryFilterList'

// 이 라우트는 /dictionary/[category] 아래에서 "대분류 슬러그"와 "사전 항목 슬러그"를
// 함께 처리한다 (Next.js는 같은 레벨에 서로 다른 동적 세그먼트 이름을 허용하지 않기 때문에
// /dictionary/[category] 와 /dictionary/[slug] 를 별도 폴더로 분리할 수 없음).
// 먼저 대분류 slug인지 확인하고, 아니면 사전 항목 slug로 취급한다.

// 해몽 사전 페이지(대분류/상세) 공용 블록 스타일 (전역 --color-brand-page는 건드리지 않음)
const BLOCK_SHAPE = 'rounded-[14px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] p-[20px_18px] md:p-[26px_24px]'

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

const getCategoryEntries = cache(async (categorySlug: string): Promise<DictionaryFilterEntry[]> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('dictionary_entries')
    .select('slug, keyword, summary, tags')
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

export const revalidate = 300

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
    <div className="flex min-h-screen flex-col">

      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[600px] flex-col gap-[14px]">

          {/* 헤더 블록 */}
          <div className={`${BLOCK_SHAPE} bg-white`}>
            <nav className="mb-2 text-sm text-[#5C6E7C]">
              <Link href="/dictionary" className="hover:text-[#2E7DD1]">해몽 사전</Link>
              <span className="mx-1.5">›</span>
              <span>{category.name}</span>
            </nav>
            <h1 className="mb-2 text-[26px] font-medium text-[#0B2433] md:text-[32px]">{category.name} 꿈 해몽</h1>
            <p className="text-[15px] text-[#5C6E7C]">
              {category.description ?? `${category.name}에 관한 꿈 키워드를 모아봤습니다.`}
            </p>
          </div>

          {/* 소분류 */}
          {subcategories.length > 0 && (
            <div className={`${BLOCK_SHAPE} bg-white`}>
              <h2 className="mb-3 text-sm font-bold text-[#5C6E7C]">세부 카테고리</h2>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/dictionary/${category.slug}/${s.slug}`}
                    className="rounded-full border border-[#DCE5EB] bg-white px-4 py-2 text-sm font-medium text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 전체 글 목록 */}
          <DictionaryFilterList entries={entries} />

          {/* 다른 카테고리 */}
          {otherCategories.length > 0 && (
            <div className={`${BLOCK_SHAPE} bg-white`}>
              <h2 className="mb-3 text-sm font-bold text-[#5C6E7C]">다른 카테고리 둘러보기</h2>
              <div className="flex flex-wrap gap-2">
                {otherCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/dictionary/${c.slug}`}
                    className="rounded-full border border-[#DCE5EB] bg-white px-4 py-2 text-sm font-medium text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                  >
                    {c.name} 해몽
                  </Link>
                ))}
                <Link
                  href="/dictionary"
                  className="rounded-full border border-[#DCE5EB] bg-white px-4 py-2 text-sm font-medium text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1]"
                >
                  전체 사전 보기
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

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#8CA0AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function DictionaryBodyBlocks({
  blocks,
  colors,
}: {
  blocks: DictionaryBodyBlock[]
  colors: CategoryColorSet
}) {
  return (
    <>
      {blocks.map((block, i) => {
        const isWarning = block.variant === 'warning'
        return (
          <div
            key={i}
            className={`${BLOCK_SHAPE} ${isWarning ? '' : 'bg-white'}`}
            style={isWarning ? { backgroundColor: '#FDF6E8' } : undefined}
          >
            {block.title && (
              <h2 className="mb-4 text-[24px] font-medium" style={{ color: isWarning ? '#5A3D10' : '#0B2433' }}>
                {block.title}
              </h2>
            )}
            <div className="flex flex-col gap-4">
              {block.children.map((child, j) =>
                child.type === 'paragraph' ? (
                  <p
                    key={j}
                    className="whitespace-pre-line text-[17px] leading-[1.95]"
                    style={{ color: isWarning ? '#5A3D10' : '#16303F' }}
                  >
                    {child.text}
                  </p>
                ) : (
                  <div key={j} className="flex flex-col gap-[12px]">
                    {child.items.map((item, k) => (
                      <div key={k} className="overflow-hidden rounded-[10px] border border-[#DCE5EB]">
                        <div
                          className="p-[13px_18px] text-[17px] font-medium"
                          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="bg-white p-[16px_18px] text-[17px] leading-[1.85] text-[#16303F]">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )
      })}
    </>
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

  // 조회수 증가 — RPC로 원자적 증가, await 하지 않아 렌더링을 막지 않는다.
  // after()로 응답 전송 후에 실행해 서버리스 함수가 일찍 종료돼도 유실되지 않게 한다.
  after(() => admin.rpc('increment_dictionary_view', { entry_slug: slug }))

  const category = entry.category_slug ? categories.find((c) => c.slug === entry.category_slug) : null
  const categoryName = category?.name ?? '기타'
  const colors = getCategoryColor(entry.category_slug)

  // 서로 의존하지 않는 조회 3개는 병렬로 실행 (관련 해몽만 subcategory 결과가 필요해 뒤에 따로 이어감)
  const [subcategory, visibleSubs, relatedDreamsResult] = await Promise.all([
    entry.subcategory_slug
      ? admin
          .from('dictionary_subcategories')
          .select('slug, name, parent_slug, description, sort_order, has_public_page, is_active')
          .eq('slug', entry.subcategory_slug)
          .single()
          .then((r) => r.data ?? null)
      : Promise.resolve(null as Subcategory | null),
    getVisibleSubcategories(),
    entry.category_slug
      ? admin
          .from('dreams')
          .select('id, title, grade, is_sold')
          .eq('category', entry.category_slug)
          .eq('is_adult', false)
          .order('created_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as { id: number; title: string; grade: string; is_sold: boolean }[] }),
  ])
  const relatedDreams = relatedDreamsResult.data
  const subcategoryIsLinkable = !!subcategory && visibleSubs.some((s) => s.slug === subcategory!.slug)

  const relatedEntries = await getRelatedEntries(admin, entry, subcategory)
  const bodyBlocks = parseDictionaryBody(entry.body)

  return (
    <div className="flex min-h-screen flex-col">

      <main className="flex-1 px-4 py-6 md:px-6 md:py-10" style={{ backgroundColor: '#DDE6EC' }}>
        <div className="mx-auto flex max-w-[600px] flex-col gap-[14px]">

          {/* 1) 헤더 블록 */}
          <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(11,36,51,0.06)]">
            <div
              className="flex flex-wrap items-center gap-1.5 px-[18px] py-2.5 text-[15px] text-white md:px-6"
              style={{ backgroundColor: colors.main }}
            >
              {category ? (
                <Link href={`/dictionary/${category.slug}`} className="hover:underline">{categoryName}</Link>
              ) : (
                <span>{categoryName}</span>
              )}
              {subcategory && (
                <>
                  <span aria-hidden>›</span>
                  {subcategoryIsLinkable && category ? (
                    <Link href={`/dictionary/${category.slug}/${subcategory.slug}`} className="hover:underline">
                      {subcategory.name}
                    </Link>
                  ) : (
                    <span>{subcategory.name}</span>
                  )}
                </>
              )}
            </div>

            <div className="p-[20px_18px] md:p-[26px_24px]">
              <h1 className="mb-3 text-[26px] font-medium text-[#0B2433] md:text-[32px]">
                {entry.keyword} 해몽
              </h1>
              <p className="text-[18px] leading-[1.85] text-[#1C3547]">
                {entry.summary}
              </p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[8px] bg-brand-primary-light px-3 py-1 text-[14px] font-semibold text-brand-primary-hover"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2)~4) 본문/항목 카드/주의 섹션 */}
          <DictionaryBodyBlocks blocks={bodyBlocks} colors={colors} />

          {/* 5) AI 해몽 CTA */}
          <div className={`${BLOCK_SHAPE} text-center`} style={{ backgroundColor: '#0B2433' }}>
            <p className="text-[20px] font-semibold text-white">내 꿈은 어떤 의미일까요?</p>
            <p className="mt-1.5 text-[16px]" style={{ color: '#A8BECC' }}>
              AI가 당신의 꿈을 직접 분석해드립니다. 지금 바로 무료로 감정받아보세요.
            </p>
            <Link
              href="/#appraisal"
              className="mt-4 inline-block w-full rounded-[10px] bg-[#2E7DD1] px-[30px] py-[14px] text-[17px] font-semibold text-white transition-transform hover:scale-[1.02] md:w-auto"
            >
              AI 해몽 받으러 가기
            </Link>
          </div>

          {/* 제휴상품 */}
          <AffiliateProducts tags={entry.tags ?? []} />

          {/* 관련 거래중인 꿈 */}
          {relatedDreams && relatedDreams.length > 0 && (
            <div className={`${BLOCK_SHAPE} bg-white`}>
              <h2 className="mb-4 text-[24px] font-medium text-[#0B2433]">관련 거래중인 꿈</h2>
              <div className="flex flex-col gap-[10px]">
                {relatedDreams.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dream/${d.id}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] bg-[#EDF3F7] px-5 py-4 text-[17px] text-[#16303F] transition-colors hover:bg-[#E4ECF1]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_INFO[d.grade as Grade]?.badgeBg ?? 'bg-gray-400'}`}>
                        {d.grade}
                      </span>
                      <span className="truncate">{d.title}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${d.is_sold ? 'bg-gray-400 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                      {d.is_sold ? '판매완료' : '구매가능'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 6) 관련 해몽 */}
          {relatedEntries.length > 0 && (
            <div className={`${BLOCK_SHAPE} bg-white`}>
              <h2 className="mb-4 text-[24px] font-medium text-[#0B2433]">같은 카테고리의 다른 해몽</h2>
              <div className="flex flex-col gap-[10px]">
                {relatedEntries.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/dictionary/${e.slug}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] bg-[#EDF3F7] px-5 py-4 text-[17px] text-[#16303F] transition-colors hover:bg-[#E4ECF1]"
                  >
                    <span className="truncate">{e.keyword} 해몽</span>
                    <ChevronRightIcon />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
