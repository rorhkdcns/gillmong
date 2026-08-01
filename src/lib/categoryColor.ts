// 해몽 사전 상세 페이지의 대분류별 강조색 (헤더 띠, 항목 카드 라벨 배지 등에 사용).

export interface CategoryColorSet {
  main: string
  badgeBg: string
  badgeText: string
}

export const CATEGORY_COLORS: Record<string, CategoryColorSet> = {
  people:  { main: '#6A4FB5', badgeBg: '#EFEBF9', badgeText: '#4A3585' },
  animals: { main: '#0F7A5A', badgeBg: '#E4F0EB', badgeText: '#0D4E3A' },
  nature:  { main: '#0E6E8C', badgeBg: '#E2F0F5', badgeText: '#0A4B60' },
  action:  { main: '#B5502A', badgeBg: '#FAEBE4', badgeText: '#83371B' },
  etc:     { main: '#5C6E7C', badgeBg: '#ECF1F4', badgeText: '#3D4E59' },
}

const DEFAULT_COLOR = CATEGORY_COLORS.etc

export function getCategoryColor(categorySlug: string | null | undefined): CategoryColorSet {
  if (!categorySlug) return DEFAULT_COLOR
  return CATEGORY_COLORS[categorySlug] ?? DEFAULT_COLOR
}
