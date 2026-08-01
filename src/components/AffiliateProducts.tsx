import { createAdminClient } from '@/lib/supabase/admin'
import AffiliateProductLink from './AffiliateProductLink'

interface Product {
  id: string
  title: string
  price_text: string | null
  image_url: string | null
  link_url: string
}

interface Props {
  tags: string[]
}

export default async function AffiliateProducts({ tags }: Props) {
  const admin = createAdminClient()

  let products: Product[] = []

  if (tags.length > 0) {
    const { data } = await admin
      .from('affiliate_products')
      .select('id, title, price_text, image_url, link_url')
      .eq('is_active', true)
      .overlaps('tags', tags)
      .order('sort_order', { ascending: true })
      .limit(3)
    products = data ?? []
  }

  if (products.length === 0) {
    const { data } = await admin
      .from('affiliate_products')
      .select('id, title, price_text, image_url, link_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(3)
    products = data ?? []
  }

  if (products.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-brand-heading">이런 상품은 어떠세요?</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((p) => (
          <AffiliateProductLink
            key={p.id}
            productId={p.id}
            href={p.link_url}
            className="flex flex-col overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm transition-shadow hover:shadow-[0_14px_28px_rgba(11,36,51,0.1)]"
          >
            <div className="aspect-square w-full bg-brand-page">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="line-clamp-2 text-sm font-medium text-brand-ink">{p.title}</p>
              {p.price_text && (
                <p className="mt-auto text-sm font-bold text-brand-violet-deep">{p.price_text}</p>
              )}
            </div>
          </AffiliateProductLink>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </section>
  )
}
