'use client'

import { useMemo, useState } from 'react'
import ImageThumbnail from './ImageThumbnail'
import AffiliateProductLink from './AffiliateProductLink'

export interface ShopGridProduct {
  id: string
  title: string
  price_text: string | null
  image_url: string | null
  link_url: string
}

interface Props {
  products: ShopGridProduct[]
}

type SortOption = 'default' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: '기본순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
]

const PAGE_SIZE = 20

/** "10,900원" 같은 텍스트에서 숫자만 뽑아낸다. 파싱 실패(빈 값·숫자 없음) 시 null. */
function parsePriceNumber(priceText: string | null): number | null {
  if (!priceText) return null
  const digits = priceText.replace(/[^0-9]/g, '')
  if (!digits) return null
  const n = parseInt(digits, 10)
  return Number.isNaN(n) ? null : n
}

export default function ShopProductGrid({ products }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('default')
  const [page, setPage] = useState(1)

  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  function handleSortChange(value: SortOption) {
    setSort(value)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.title.toLowerCase().includes(q))
  }, [products, query])

  const sorted = useMemo(() => {
    if (sort === 'default') return filtered
    // 가격 미상(null)인 상품은 정렬 방향과 무관하게 항상 맨 뒤로 보낸다.
    const withPrice: [ShopGridProduct, number][] = []
    const withoutPrice: ShopGridProduct[] = []
    for (const p of filtered) {
      const price = parsePriceNumber(p.price_text)
      if (price === null) withoutPrice.push(p)
      else withPrice.push([p, price])
    }
    withPrice.sort((a, b) => (sort === 'price_asc' ? a[1] - b[1] : b[1] - a[1]))
    return [...withPrice.map(([p]) => p), ...withoutPrice]
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="rounded-[14px] bg-white p-[20px_18px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] md:p-[26px_24px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="상품명으로 검색해보세요"
          className="w-full rounded-[10px] border border-[#DCE5EB] bg-white px-4 py-2.5 text-sm text-[#16303F] outline-none focus:border-[#2E7DD1] sm:flex-1"
        />
        <div className="flex shrink-0 gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSortChange(opt.value)}
              className={`rounded-[8px] px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm ${
                sort === opt.value
                  ? 'bg-[#2E7DD1] text-white'
                  : 'border border-[#DCE5EB] text-[#5C6E7C] hover:border-[#2E7DD1] hover:text-[#2E7DD1]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {products.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#5C6E7C]">등록된 상품이 없습니다.</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#5C6E7C]">검색 결과가 없습니다.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {paged.map((p) => (
                <AffiliateProductLink
                  key={p.id}
                  productId={p.id}
                  href={p.link_url}
                  className="flex flex-col overflow-hidden rounded-[10px] border border-[#DCE5EB] transition-shadow hover:shadow-[0_6px_16px_rgba(11,36,51,0.08)]"
                >
                  <div className="aspect-square w-full bg-[#EDF3F7]">
                    <ImageThumbnail src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium text-[#16303F]">{p.title}</p>
                    {p.price_text && (
                      <p className="mt-auto text-sm font-bold text-brand-violet-deep">{p.price_text}</p>
                    )}
                    <div className="mt-2 rounded-[6px] bg-brand-primary py-1.5 text-center text-xs font-semibold text-white">
                      구매하러 가기
                    </div>
                  </div>
                </AffiliateProductLink>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-[8px] border border-[#DCE5EB] px-3 py-1.5 text-sm font-semibold text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-sm text-[#5C6E7C]">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-[8px] border border-[#DCE5EB] px-3 py-1.5 text-sm font-semibold text-[#5C6E7C] transition-colors hover:border-[#2E7DD1] hover:text-[#2E7DD1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 쿠팡파트너스 필수 고지 */}
      <p className="mt-3 text-xs text-gray-400">
        이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  )
}
