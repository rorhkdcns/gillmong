// 제휴 상품명에서 꿈해몽 상징/길운 관련 키워드를 찾아 태그를 자동 제안한다.
// 사전 항목(dictionary_entries)과 노출을 매칭시키는 tags 컬럼을 채우는 데 쓰이며,
// 어디까지나 "제안"이므로 호출부는 사용자가 등록 전에 자유롭게 수정/삭제할 수 있게 해야 한다.

interface TagRule {
  keywords: string[]
  tags: string[]
}

// 순서가 곧 매칭 우선순위(먼저 나온 규칙의 태그가 먼저 붙음). 기존에 태그가 채워져 있던
// 제휴 상품들의 실제 title↔tags 대응 관계를 참고해 만든 목록이라, 새 규칙을 추가할 땐
// 비슷한 형태로 "핵심 단어 → [자기 자신, (있다면) 상위 개념 태그]" 순으로 유지한다.
const TAG_RULES: TagRule[] = [
  { keywords: ['돼지'], tags: ['돼지', '재물운'] },
  { keywords: ['재물운', '재물'], tags: ['재물운'] },
  { keywords: ['금', '황금', '골드'], tags: ['금', '재물운'] },
  { keywords: ['네잎클로버', '네잎클로바', '클로버'], tags: ['네잎클로버', '행운'] },
  { keywords: ['거북이', '거북'], tags: ['거북이', '행운'] },
  { keywords: ['달마'], tags: ['달마', '행운'] },
  { keywords: ['행운'], tags: ['행운'] },
  { keywords: ['액막이', '부적', '액운'], tags: ['액막이', '액운'] },
  { keywords: ['드림캐쳐', '드림캐처'], tags: ['드림캐쳐', '해몽'] },
  { keywords: ['뱀'], tags: ['뱀'] },
  { keywords: ['용'], tags: ['용'] },
  { keywords: ['호랑이'], tags: ['호랑이'] },
  { keywords: ['강아지', '멍멍이'], tags: ['강아지'] },
  { keywords: ['고양이'], tags: ['고양이'] },
  { keywords: ['토끼'], tags: ['토끼'] },
]

/** "황금돼지 저금통" → ['돼지', '재물운', '금'] 처럼 상품명에 포함된 키워드 규칙을 순서대로 적용해 태그를 제안한다. */
export function suggestTagsFromTitle(title: string): string[] {
  const tags = new Set<string>()
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((keyword) => title.includes(keyword))) {
      for (const tag of rule.tags) tags.add(tag)
    }
  }
  return Array.from(tags)
}
