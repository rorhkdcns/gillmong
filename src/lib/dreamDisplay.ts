// 등급·해몽 표시에 쓰이는 공용 색상/라벨 정의.
// DreamCard / DreamDetail / guide 페이지 / ResultModal / saved 페이지에
// 흩어져 있던 서로 다른 등급-색상 매핑을 하나로 통합한다.

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

interface GradeInfo {
  badgeBg: string
  text: string
  /** 꿈 상세/저장 페이지에서 등급 원 아래 보여주는 설명형 라벨 (예: "최고의 길몽") */
  label: string
  /** 등급 안내 섹션의 짧은 등급명 (예: "최상위 등급") */
  rank: string
  /** 등급 안내 섹션의 긴 설명 */
  desc: string
}

export const GRADE_INFO: Record<Grade, GradeInfo> = {
  A: { badgeBg: 'bg-emerald-500', text: 'text-emerald-600', label: '최고의 길몽',     rank: '최상위 등급', desc: '드물게 나타나는 최고의 길몽' },
  B: { badgeBg: 'bg-blue-500',    text: 'text-blue-600',    label: '좋은 길몽',       rank: '상위 등급',   desc: '뚜렷한 행운의 전조가 보이는 꿈' },
  C: { badgeBg: 'bg-amber-400',   text: 'text-amber-500',   label: '평범한 꿈',       rank: '일반 등급',   desc: '긍정적인 의미를 담은 좋은 꿈' },
  D: { badgeBg: 'bg-orange-500',  text: 'text-orange-500',  label: '주의가 필요한 꿈', rank: '주의 등급',   desc: '경고·부담·위험을 암시하는 꿈' },
  E: { badgeBg: 'bg-red-500',     text: 'text-red-500',     label: '흉몽의 기운',     rank: '흉몽 등급',   desc: '두려움·상실·불안이 담긴 꿈' },
  F: { badgeBg: 'bg-gray-400',    text: 'text-gray-500',    label: '해석 불가',       rank: '',            desc: '' },
}

/** 홈페이지/가이드 "등급 안내" 섹션에서 쓰는 A~E 목록 (AI 감정 결과는 F를 반환하지 않음) */
export const GRADE_GUIDE_LIST = (['A', 'B', 'C', 'D', 'E'] as const).map((grade) => ({
  grade,
  ...GRADE_INFO[grade],
}))

export const TYPE_STYLE: Record<string, string> = {
  길몽: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  흉몽: 'bg-red-50 text-red-500 border-red-200',
  중립: 'bg-gray-100 text-gray-500 border-gray-200',
}

/** 해몽 본문에서 "한국 전통 해몽 관점:" 등 소제목을 찾아 색을 입히는 데 쓰는 패턴 */
export const INTERPRETATION_SECTIONS = [
  { pattern: /한국\s*전통\s*해몽\s*관점\s*:/, color: '#0B2433' },
  { pattern: /아시아\s*관점[^:]*:/,            color: '#14547A' },
  { pattern: /서양\s*심리학적\s*관점\s*:/,     color: 'var(--color-brand-slate)' },
  { pattern: /종합\s*해석\s*:/,                color: '#0B2433' },
]

export interface InterpretationSection {
  title: string
  content: string
  color: string
}

export function parseInterpretation(text: string): InterpretationSection[] {
  const lines = text.split('\n')
  const sections: InterpretationSection[] = []
  let cur: { title: string; lines: string[]; color: string } | null = null

  for (const line of lines) {
    const matched = INTERPRETATION_SECTIONS.find((s) => s.pattern.test(line.trim()))
    if (matched) {
      if (cur) sections.push({ title: cur.title, content: cur.lines.join('\n').trim(), color: cur.color })
      cur = { title: line.trim(), lines: [], color: matched.color }
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  if (cur) sections.push({ title: cur.title, content: cur.lines.join('\n').trim(), color: cur.color })
  return sections
}
