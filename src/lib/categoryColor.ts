// 해몽 사전 상세 페이지의 대분류별 강조색 (헤더 띠, 항목 카드 라벨 배지 등에 사용).

export interface CategoryColorSet {
  main: string
  badgeBg: string
  badgeText: string
}

export const CATEGORY_COLORS: Record<string, CategoryColorSet> = {
  people:  { main: '#C23A18', badgeBg: '#FFE9E0', badgeText: '#8F2A10' },
  animals: { main: '#0B6A36', badgeBg: '#D3F0DE', badgeText: '#0B6A36' },
  nature:  { main: '#1B4DB3', badgeBg: '#D6E6FF', badgeText: '#1B4DB3' },
  action:  { main: '#7A4B00', badgeBg: '#FFE9A8', badgeText: '#7A4B00' },
  etc:     { main: '#6B605A', badgeBg: '#F0E6DF', badgeText: '#3A322C' },
}

const DEFAULT_COLOR = CATEGORY_COLORS.etc

export function getCategoryColor(categorySlug: string | null | undefined): CategoryColorSet {
  if (!categorySlug) return DEFAULT_COLOR
  return CATEGORY_COLORS[categorySlug] ?? DEFAULT_COLOR
}
