'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ShopCategory {
  id: string
  name: string
  slug: string
}
interface ShopSubcategory {
  id: string
  name: string
  slug: string
}

interface Props {
  categories: ShopCategory[]
  subcategoriesByCategory: Record<string, ShopSubcategory[]>
}

const LINK_BASE = 'block rounded-[8px] px-3 py-2 text-sm transition-colors'
const LINK_INACTIVE = 'font-medium text-[#5C6E7C] hover:bg-[#F1F5F8] hover:text-[#2E7DD1]'
const LINK_ACTIVE = 'font-semibold text-[#2E7DD1] bg-[#EAF2FB]'

export default function ShopSidebar({ categories, subcategoriesByCategory }: Props) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean) // ['shop', category?, sub?]
  const currentCategorySlug = segments[1]
  const currentSubSlug = segments[2]

  return (
    <aside className="w-full shrink-0 md:w-[240px]">
      <nav className="flex flex-col gap-1 rounded-[14px] bg-white p-3 shadow-[0_1px_3px_rgba(11,36,51,0.06)] md:sticky md:top-4">
        <Link href="/shop" className={`${LINK_BASE} ${!currentCategorySlug ? LINK_ACTIVE : LINK_INACTIVE}`}>
          전체
        </Link>

        {categories.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-[#8A9AA6]">등록된 상품을 준비 중입니다.</p>
        )}

        {categories.map((c) => {
          const isCategoryActive = c.slug === currentCategorySlug
          const subs = subcategoriesByCategory[c.id] ?? []
          return (
            <div key={c.id}>
              <Link
                href={`/shop/${c.slug}`}
                className={`${LINK_BASE} ${isCategoryActive && !currentSubSlug ? LINK_ACTIVE : LINK_INACTIVE}`}
              >
                {c.name}
              </Link>
              {isCategoryActive && subs.length > 0 && (
                <div className="ml-3 flex flex-col gap-1 border-l border-[#DCE5EB] pl-3">
                  {subs.map((s) => (
                    <Link
                      key={s.id}
                      href={`/shop/${c.slug}/${s.slug}`}
                      className={`${LINK_BASE} ${s.slug === currentSubSlug ? LINK_ACTIVE : LINK_INACTIVE}`}
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
