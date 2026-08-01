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

interface Props {
  entries: DictEntry[]
  categoryNameMap: Record<string, string>
}

const UNCATEGORIZED = '기타'

export default function DictionaryList({ entries, categoryNameMap }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      e.keyword.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }, [entries, query])

  const grouped = useMemo(() => {
    const map = new Map<string, DictEntry[]>()
    for (const entry of filtered) {
      const name = (entry.category_slug && categoryNameMap[entry.category_slug]) || UNCATEGORIZED
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(entry)
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === UNCATEGORIZED) return 1
      if (b[0] === UNCATEGORIZED) return -1
      return a[0].localeCompare(b[0])
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

        <div className="mx-auto mt-6 max-w-6xl border-b border-brand-line" />
      </section>

      <section className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {grouped.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              {entries.length === 0 ? '아직 등록된 사전 항목이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          ) : (
            grouped.map(([categoryName, items]) => (
              <div key={categoryName} className="mb-10">
                <h2 className="mb-4 text-lg font-bold text-brand-heading">{categoryName}</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {items.map((entry) => (
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
