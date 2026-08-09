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

const PAGE_SIZE = 20

export default function ShopProductGrid({ products }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.title.toLowerCase().includes(q))
  }, [products, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="rounded-[14px] bg-white p-[20px_18px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] md:p-[26px_24px]">
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="상품명으로 검색해보세요"
        className="w-full rounded-[10px] border border-[#DCE5EB] bg-white px-4 py-2.5 text-sm text-[#16303F] outline-none focus:border-[#2E7DD1]"
      />

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
