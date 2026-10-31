// 굿즈샵 상품 중복 판별. 같은 상품이 링크 파라미터나 제목 공백만 달라 여러 번 등록된 경우를 하나로 본다.
export function productKey(p: { link_url?: string | null; title?: string | null }): string {
  const url = p.link_url ?? ''
  const m = url.match(/\/products\/(\d+)/) ?? url.match(/[?&](?:itemId|productId|vendorItemId)=(\d+)/)
  if (m) return `cp:${m[1]}`
  const t = (p.title ?? '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
  if (t) return `t:${t}`
  return `u:${url.split('?')[0]}`
}

/** 이미 정렬된 목록에서 먼저 나온 것만 남기고 중복을 제거한다. */
export function dedupeProducts<T extends { link_url?: string | null; title?: string | null }>(list: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const p of list) {
    const k = productKey(p)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out
}
