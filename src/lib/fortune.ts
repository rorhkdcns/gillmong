/**
 * 오늘의 운세(띠·별자리) 기능에서 공유하는 상수/순수 함수.
 * cron 라우트(생성)와 /fortune 페이지(조회·자동판별)가 함께 참조한다.
 */

export type FortuneType = 'zodiac' | 'star'

export const ZODIAC_ANIMALS = [
  { key: '쥐', emoji: '🐭' },
  { key: '소', emoji: '🐮' },
  { key: '호랑이', emoji: '🐯' },
  { key: '토끼', emoji: '🐰' },
  { key: '용', emoji: '🐲' },
  { key: '뱀', emoji: '🐍' },
  { key: '말', emoji: '🐴' },
  { key: '양', emoji: '🐑' },
  { key: '원숭이', emoji: '🐵' },
  { key: '닭', emoji: '🐔' },
  { key: '개', emoji: '🐶' },
  { key: '돼지', emoji: '🐷' },
] as const

export const STAR_SIGNS = [
  { key: '양자리', symbol: '♈', label: '3.21~4.19', start: [3, 21], end: [4, 19] },
  { key: '황소자리', symbol: '♉', label: '4.20~5.20', start: [4, 20], end: [5, 20] },
  { key: '쌍둥이자리', symbol: '♊', label: '5.21~6.21', start: [5, 21], end: [6, 21] },
  { key: '게자리', symbol: '♋', label: '6.22~7.22', start: [6, 22], end: [7, 22] },
  { key: '사자자리', symbol: '♌', label: '7.23~8.22', start: [7, 23], end: [8, 22] },
  { key: '처녀자리', symbol: '♍', label: '8.23~9.22', start: [8, 23], end: [9, 22] },
  { key: '천칭자리', symbol: '♎', label: '9.23~10.23', start: [9, 23], end: [10, 23] },
  { key: '전갈자리', symbol: '♏', label: '10.24~11.22', start: [10, 24], end: [11, 22] },
  { key: '사수자리', symbol: '♐', label: '11.23~12.21', start: [11, 23], end: [12, 21] },
  { key: '염소자리', symbol: '♑', label: '12.22~1.19', start: [12, 22], end: [1, 19] },
  { key: '물병자리', symbol: '♒', label: '1.20~2.18', start: [1, 20], end: [2, 18] },
  { key: '물고기자리', symbol: '♓', label: '2.19~3.20', start: [2, 19], end: [3, 20] },
] as const satisfies readonly { key: string; symbol: string; label: string; start: [number, number]; end: [number, number] }[]

export const ZODIAC_KEYS = ZODIAC_ANIMALS.map((a) => a.key)
export const STAR_KEYS = STAR_SIGNS.map((s) => s.key)

/** 양력 연도로 띠를 계산한다. idx: 0=쥐,1=소,...11=돼지 */
export function getZodiacKeyByYear(year: number): string {
  const idx = ((year - 4) % 12 + 12) % 12
  return ZODIAC_ANIMALS[idx].key
}

/** 생일(월/일)로 별자리를 계산한다. 연도 경계를 넘는 염소자리(12/22~1/19)도 처리. */
export function getStarSignKeyByDate(month: number, day: number): string | null {
  for (const s of STAR_SIGNS) {
    const [sm, sd] = s.start
    const [em, ed] = s.end
    if (sm <= em) {
      if ((month === sm && day >= sd) || (month > sm && month < em) || (month === em && day <= ed)) return s.key
    } else {
      if ((month === sm && day >= sd) || month > sm || month < em || (month === em && day <= ed)) return s.key
    }
  }
  return null
}

/** KST(UTC+9) 기준 오늘 날짜를 'YYYY-MM-DD'로 반환한다. */
export function getKSTDateString(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 3600 * 1000)
  return kst.toISOString().slice(0, 10)
}
