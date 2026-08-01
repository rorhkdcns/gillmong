// 해몽 사전 본문(body) 텍스트를 블록 배열로 파싱한다.
// 문법 (신규 — 마크다운 기호(##, *)와 겹치지 않도록 사용. Gemini가 마크다운 기호를
// 출력 단계에서 삼켜버려 "##"/"##!"/"-"로는 실제 사용이 불가능했음):
//   "[[제목]]"    → 일반 섹션 시작
//   "[[!제목]]"   → 주의 섹션 시작 (앰버 톤)
//   ">라벨 | 설명" 연속 줄 → 항목 카드 묶음 ("|" 없으면 전체를 라벨로 처리)
//   "라벨 | 설명" (">" 없이) → "|" 앞뒤가 모두 비어있지 않고 라벨이 40자 이내면 항목으로 인식
//     (Gemini가 ">" 도 마크다운 인용 기호로 오인해 삼켜버리는 문제 대응)
//   빈 줄          → 문단/항목 묶음 구분자
//   그 외          → 현재 섹션의 문단
// 첫 섹션 이전 텍스트는 리드 블록(title 없음)으로 취급.
//
// 하위 호환: 기존에 등록된 글이 깨지지 않도록 구 문법도 계속 인식한다.
//   "## 제목", "##! 제목", "- 라벨 — 설명" (em dash 구분자)

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

    // 신규: [[제목]] / [[!제목]]
    if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
      flushAll()
      if (trimmed.startsWith('[[!')) {
        current = { type: 'section', variant: 'warning', title: trimmed.slice(3, -2).trim(), children: [] }
      } else {
        current = { type: 'section', variant: 'normal', title: trimmed.slice(2, -2).trim(), children: [] }
      }
      blocks.push(current)
      continue
    }
    // 구 문법: ## 제목 / ##! 제목
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
    // 신규: >라벨 | 설명
    if (trimmed.startsWith('>')) {
      flushPara()
      const itemText = trimmed.slice(1).trim()
      const pipeIdx = itemText.indexOf('|')
      if (pipeIdx >= 0) {
        itemBuffer.push({ label: itemText.slice(0, pipeIdx).trim(), description: itemText.slice(pipeIdx + 1).trim() })
      } else {
        itemBuffer.push({ label: itemText, description: '' })
      }
      continue
    }
    // 구 문법: - 라벨 — 설명 (em dash 구분자)
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
    // 신규: ">" 없이 "라벨 | 설명"만 와도 항목으로 인식.
    // Gemini가 ">" 도 마크다운 인용 기호로 오인해 삼켜버리는 문제 대응.
    // 문단 속 우연한 "|"를 항목으로 오판하지 않도록 라벨이 40자 이내일 때만 인정한다.
    {
      const pipeIdx = trimmed.indexOf('|')
      if (pipeIdx > 0) {
        const label = trimmed.slice(0, pipeIdx).trim()
        const description = trimmed.slice(pipeIdx + 1).trim()
        if (label && description && label.length <= 40) {
          flushPara()
          itemBuffer.push({ label, description })
          continue
        }
      }
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
