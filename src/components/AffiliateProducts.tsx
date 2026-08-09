import { createAdminClient } from '@/lib/supabase/admin'
import AffiliateProductLink from './AffiliateProductLink'
import ImageThumbnail from './ImageThumbnail'

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

const CANDIDATE_POOL_SIZE = 8
const EXPOSURE_COUNT = 4

/** Fisher-Yates로 n개를 무작위 추출. n개 이하면 원본을 그대로 반환. */
function pickRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export default async function AffiliateProducts({ tags }: Props) {
  const admin = createAdminClient()

  let candidates: Product[] = []

  if (tags.length > 0) {
    const { data } = await admin
      .from('affiliate_products')
      .select('id, title, price_text, image_url, link_url')
      .eq('is_active', true)
      .overlaps('tags', tags)
      .order('sort_order', { ascending: true })
      .limit(CANDIDATE_POOL_SIZE)
    candidates = data ?? []
  }

  if (candidates.length === 0) {
    // ★ 태그 매칭 0건일 때의 폴백 — 대부분의 제휴상품이 아직 태그가 비어있어서
    //   사실상 이 경로가 기본값이나 다름없다. CANDIDATE_POOL_SIZE(8)로 제한하면
    //   sort_order 상위 8개(초반에 등록한 특정 카테고리)만 계속 뽑혀서 사전 글
    //   주제와 무관하게 같은 상품군만 반복 노출되므로, 여기서는 활성 상품 전체를
    //   후보로 가져와 무작위 추출 풀을 넓힌다.
    const { data } = await admin
      .from('affiliate_products')
      .select('id, title, price_text, image_url, link_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    candidates = data ?? []
  }

  if (candidates.length === 0) return null

  // ★ revalidate=300 ISR 페이지에서 렌더링될 때마다(=캐시 재생성 시점마다) 다시 뽑힌다.
  //   요청마다가 아니라 5분 주기 로테이션 효과 — 의도된 동작이니 그대로 둘 것.
  const products = pickRandom(candidates, EXPOSURE_COUNT)

  if (products.length === 0) return null

  // 노출 집계 — 렌더링을 막지 않도록 절대 await 하지 않는다.
  Promise.resolve(
    admin.rpc('increment_affiliate_impressions', { ids: products.map((p) => p.id) })
  ).catch(() => {})

  return (
    <section className="rounded-[14px] bg-white p-[20px_18px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] md:p-[26px_24px]">
      <h2 className="mb-4 text-2xl font-medium text-[#0B2433]">이런 상품은 어떠세요?</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((p) => (
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
      <p className="mt-3 text-xs text-gray-400">
        이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </section>
  )
}
