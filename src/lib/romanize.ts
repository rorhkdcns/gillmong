// 한글 표제어 → 로마자 변환 (표준 로마자 표기법 간이 구현).
// src/lib/slugify.ts의 매핑표(keywordToSlug)에 없는 단어가 섞인 표제어의 slug 폴백으로 쓴다.

const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const JONG = ['', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h']

function romanizeSyllable(ch: string): string {
  const code = ch.charCodeAt(0) - 0xAC00
  if (code < 0 || code > 11171) return ''
  const cho = Math.floor(code / (21 * 28))
  const rem = code % (21 * 28)
  const jung = Math.floor(rem / 28)
  const jong = rem % 28
  return CHO[cho] + JUNG[jung] + JONG[jong]
}

export function romanize(text: string): string {
  return text.trim().split(/\s+/).map((word) =>
    Array.from(word).filter((c) => c >= '가' && c <= '힣')
      .map(romanizeSyllable).join('')
  ).filter(Boolean).join('-')
}
