// 해몽 사전 본문(body) 텍스트를 블록 배열로 파싱한다.
// 문법:
//   "## 제목"   → 일반 섹션 시작
//   "##! 제목"  → 주의 섹션 시작 (앰버 톤)
//   "- 라벨 — 설명" 연속 줄 → 항목 카드 묶음 (구분자는 em dash "—", 없으면 전체를 라벨로 처리)
//   빈 줄        → 문단/항목 묶음 구분자
//   그 외        → 현재 섹션의 문단
// 첫 "##" 이전 텍스트는 리드 블록(title 없음)으로 취급.

export interface DictionaryItem {
  label: string
  description: string
}

export type SectionChild =
  | { type: 'paragraph'; text: string }
  | { type: 'items'; items: DictionaryItem[] }

export interface DictionaryBodyBlock {
  type: 'lead' | 'section'
  variant: 'normal' | 'warning'
  title: string
  children: SectionChild[]
}

export function parseDictionaryBody(body: string): DictionaryBodyBlock[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n')

  const blocks: DictionaryBodyBlock[] = []
  let current: DictionaryBodyBlock = { type: 'lead', variant: 'normal', title: '', children: [] }
  blocks.push(current)

  let paraBuffer: string[] = []
  let itemBuffer: DictionaryItem[] = []

  function flushPara() {
    if (paraBuffer.length > 0) {
      const text = paraBuffer.join('\n').trim()
      if (text) current.children.push({ type: 'paragraph', text })
      paraBuffer = []
    }
  }
  function flushItems() {
    if (itemBuffer.length > 0) {
      current.children.push({ type: 'items', items: itemBuffer })
      itemBuffer = []
    }
  }
  function flushAll() {
    flushPara()
    flushItems()
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()

    if (trimmed.startsWith('##!')) {
      flushAll()
      current = { type: 'section', variant: 'warning', title: trimmed.slice(3).trim(), children: [] }
      blocks.push(current)
      continue
    }
    if (trimmed.startsWith('##')) {
      flushAll()
      current = { type: 'section', variant: 'normal', title: trimmed.slice(2).trim(), children: [] }
      blocks.push(current)
      continue
    }
    if (trimmed.startsWith('- ')) {
      flushPara()
      const itemText = trimmed.slice(2).trim()
      const dashIdx = itemText.indexOf('—')
      if (dashIdx >= 0) {
        itemBuffer.push({ label: itemText.slice(0, dashIdx).trim(), description: itemText.slice(dashIdx + 1).trim() })
      } else {
        itemBuffer.push({ label: itemText, description: '' })
      }
      continue
    }
    if (trimmed === '') {
      flushAll()
      continue
    }

    flushItems()
    paraBuffer.push(trimmed)
  }
  flushAll()

  return blocks.filter((b) => b.children.length > 0)
}
