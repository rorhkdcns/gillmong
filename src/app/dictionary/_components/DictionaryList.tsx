'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

interface DictEntry {
  slug: string
  keyword: string
  summary: string
  category_slug: string | null
  tags: string[] | null
}

interface CategoryOption {
  slug: string
  name: string
}

interface Props {
  entries: DictEntry[]
  categories: CategoryOption[]
}

const UNCATEGORIZED = '기타'
const ALL_FILTER = '__all__'

export default function DictionaryList({ entries, categories }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL_FILTER)

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of categories) map[c.slug] = c.name
    return map
  }, [categories])

  const filtered = useMemo(() => {
    let list = entries
    if (activeCategory !== ALL_FILTER) {
      list = list.filter((e) => (e.category_slug ?? '') === activeCategory)
    }
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((e) =>
      e.keyword.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }, [entries, query, activeCategory])

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: DictEntry[] }>()
    for (const entry of filtered) {
      const key = entry.category_slug ?? ''
      const name = (entry.category_slug && categoryNameMap[entry.category_slug]) || UNCATEGORIZED
      if (!map.has(key)) map.set(key, { name, items: [] })
      map.get(key)!.items.push(entry)
    }
    return [...map.entries()].sort(([, a], [, b]) => {
      if (a.name === UNCATEGORIZED) return 1
      if (b.name === UNCATEGORIZED) return -1
      return a.name.localeCompare(b.name)
    })
  }, [filtered, categoryNameMap])

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <SiteHeader />

      <section className="bg-white px-6 pb-6 pt-14 text-center">
        <h1 className="mb-3 text-4xl text-brand-ink">꿈해몽 사전</h1>
        <p className="mb-6 text-base text-brand-ink-soft">
          자주 검색되는 꿈 키워드를 한국 전통·동양·서양 심리학 관점으로 풀이했습니다.
        </p>

        <div className="mx-auto max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="궁금한 꿈을 검색해보세요 (예: 돼지꿈, 뱀꿈)"
            className="w-full rounded-full border border-brand-line bg-white px-5 py-3 text-sm text-brand-ink outline-none focus:border-brand-violet"
          />
        </div>

        {/* 카테고리 필터 칩 */}
        {categories.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(ALL_FILTER)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === ALL_FILTER
                  ? 'bg-brand-ink text-white'
                  : 'border border-brand-line text-brand-ink-soft hover:border-brand-violet hover:text-brand-violet-deep'
              }`}
            >
              전체
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setActiveCategory(c.slug)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === c.slug
                    ? 'bg-brand-ink text-white'
                    : 'border border-brand-line text-brand-ink-soft hover:border-brand-violet hover:text-brand-violet-deep'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="mx-auto mt-6 max-w-6xl border-b border-brand-line" />
      </section>

      <section className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {grouped.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              {entries.length === 0 ? '아직 등록된 사전 항목이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          ) : (
            grouped.map(([categorySlug, group]) => (
              <div key={categorySlug || UNCATEGORIZED} className="mb-10">
                {categorySlug ? (
                  <Link
                    href={`/dictionary/category/${categorySlug}`}
                    className="mb-4 inline-flex items-center gap-1 text-lg font-bold text-brand-heading hover:text-brand-violet-deep"
                  >
                    {group.name}
                    <span aria-hidden className="text-sm">›</span>
                  </Link>
                ) : (
                  <h2 className="mb-4 text-lg font-bold text-brand-heading">{group.name}</h2>
                )}
                <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((entry) => (
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
              </div>
            ))
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
