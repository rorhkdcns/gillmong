'use client'

import { useState } from 'react'
import Link from 'next/link'
import DreamCard, { type DreamCardProps } from '@/components/DreamCard'

interface Tab { slug: string; name: string }
type Dream = DreamCardProps & { created_at?: string }

// "지금 팔고 있는 꿈": 카테고리 탭 + 카드 그리드. 데이터는 서버(page.tsx)가 이미 조회해서 내려준다.
export default function DreamMarket({ tabs, dreamsByTab, all }: { tabs: Tab[]; dreamsByTab: Dream[][]; all: Dream[] }) {
  const [active, setActive] = useState<string>('all')
  const idx = tabs.findIndex((t) => t.slug === active)
  const list = (active === 'all' ? all : dreamsByTab[idx] ?? []).slice(0, 8)
  const moreHref = active === 'all' ? '/category/all' : `/category/${active}`

  return (
    <section id="market" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-10 md:py-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">지금 팔고 있는 꿈</h2>
        <Link href={moreHref} className="text-sm font-semibold text-brand-ink-soft transition-colors hover:text-brand-primary">전체 보기 →</Link>
      </div>

      <div role="tablist" aria-label="꿈 분류" className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {[{ slug: 'all', name: '전체' }, ...tabs].map((t) => {
          const on = t.slug === active
          return (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.slug)}
              className={`shrink-0 rounded-[3px] border-2 px-4 py-2 text-sm transition-colors ${on ? 'border-brand-ink bg-brand-ink font-bold text-white' : 'border-brand-line bg-white font-medium text-brand-ink hover:border-brand-ink'}`}
            >
              {t.name}
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-[4px] border-2 border-dashed border-brand-line py-16 text-center text-sm text-brand-ink-soft">이 분류에는 아직 등록된 꿈이 없어요</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {list.map((d) => (
            <DreamCard key={d.id} {...d} />
          ))}
        </div>
      )}
    </section>
  )
}
