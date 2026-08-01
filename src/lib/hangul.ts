// 한글 초성 추출 유틸. 해몽 사전 목록의 초성(ㄱ~ㅎ) 필터에서 사용.

export const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
  'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

// 쌍자음은 필터 버튼을 늘리지 않고 대표 자음 버튼에 포함시킨다.
const DOUBLE_TO_BASE: Record<string, string> = {
  'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ',
}

/** 필터 버튼으로 노출할 14개 대표 초성 (전체 는 버튼 목록에서 별도 처리) */
export const CHOSEONG_GROUPS = CHO.filter((c) => !(c in DOUBLE_TO_BASE))

export const ETC_GROUP = '기타'

/** 문자열 첫 글자의 초성 그룹을 반환. 한글 음절이 아니면 '기타'. */
export function getChoseongGroup(text: string): string {
  const char = text.trim().charAt(0)
  if (!char) return ETC_GROUP

  const code = char.charCodeAt(0)
  if (code < 0xAC00 || code > 0xD7A3) return ETC_GROUP

  const choIndex = Math.floor((code - 0xAC00) / 588)
  const cho = CHO[choIndex]
  return DOUBLE_TO_BASE[cho] ?? cho
}
