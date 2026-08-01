// 해몽 사전 키워드(한글) → slug(영문) 자동 변환.
// 정식 형태소 분석기 없이, 자주 쓰는 꿈 단어 위주의 매핑 테이블 + 간단한 조사/어미 스트리핑으로 처리한다.
// 매핑에 없는 단어는 변환하지 않고 그대로 남겨(호출부에서 미매칭으로 안내) 사용자가 직접 채우게 한다.

export const NOUN_MAP: Record<string, string> = {
  돼지: 'pig', 뱀: 'snake', 용: 'dragon', 소: 'cow', 말: 'horse', 개: 'dog', 고양이: 'cat',
  호랑이: 'tiger', 물고기: 'fish', 새: 'bird', 닭: 'chicken', 벌레: 'insect',
  꽃: 'flower', 나무: 'tree', 과일: 'fruit', 물: 'water', 불: 'fire', 똥: 'poop',
  돈: 'money', 금: 'gold', 반지: 'ring', 집: 'house', 차: 'car', 옷: 'clothes',
  아기: 'baby', 아이: 'child', 엄마: 'mom', 아빠: 'dad', 할머니: 'grandma',
  할아버지: 'grandpa', 연예인: 'celebrity', 시험: 'exam', 결혼: 'wedding',
  죽음: 'death', 피: 'blood', 이빨: 'tooth', 머리카락: 'hair', 임신: 'pregnancy',
  태몽: 'taemong', 하늘: 'sky', 바다: 'sea', 산: 'mountain',
}

// 동사는 사전형(다) 기준. 실제 문장에서는 "-는" 활용형으로 주로 등장하므로
// 사전형과 현재형(-는) 표면형을 함께 매핑 테이블에 올려둔다.
const VERB_BASE: Record<string, string> = {
  물리다: 'bite', 줍다: 'pickup', 먹다: 'eat', 잡다: 'catch', 죽이다: 'kill',
  날다: 'fly', 쫓기다: 'chase', 떨어지다: 'fall', 싸우다: 'fight',
  사다: 'buy', 잃다: 'lose', 타다: 'ride', 씻다: 'wash', 울다: 'cry',
}

// ㄹ 불규칙 활용(날다→나는, 울다→우는)만 예외 처리하면 되고, 나머지는 어간 + "는"으로 충분함.
const IRREGULAR_PRESENT: Record<string, string> = {
  날다: '나는',
  울다: '우는',
}

function buildVerbSurfaceMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [base, eng] of Object.entries(VERB_BASE)) {
    map[base] = eng
    const present = IRREGULAR_PRESENT[base] ?? `${base.slice(0, -1)}는`
    map[present] = eng
  }
  return map
}

const VERB_SURFACE_MAP = buildVerbSurfaceMap()

// 명사에 흔히 붙는 조사. 긴 것부터 매칭해야 잘못 잘리지 않는다 (예: "에게서"를 "에"보다 먼저 검사).
const PARTICLES = [
  '에게서', '에서', '에게', '으로', '하고',
  '을', '를', '이', '가', '은', '는', '의', '로', '와', '과', '도', '만', '에', '랑',
].sort((a, b) => b.length - a.length)

function convertWord(word: string): { text: string; matched: boolean } {
  if (NOUN_MAP[word]) return { text: NOUN_MAP[word], matched: true }
  if (VERB_SURFACE_MAP[word]) return { text: VERB_SURFACE_MAP[word], matched: true }

  for (const particle of PARTICLES) {
    if (word.length > particle.length && word.endsWith(particle)) {
      const stripped = word.slice(0, -particle.length)
      if (NOUN_MAP[stripped]) return { text: NOUN_MAP[stripped], matched: true }
      if (VERB_SURFACE_MAP[stripped]) return { text: VERB_SURFACE_MAP[stripped], matched: true }
    }
  }

  return { text: '', matched: false }
}

export interface SlugifyResult {
  /** 하이픈으로 연결된 slug 후보 (매칭된 단어만 포함). 아예 매칭이 없으면 빈 문자열. */
  slug: string
  /** 매핑에서 찾지 못한 단어가 하나라도 있었는지 */
  hasUnmatched: boolean
}

/** "돼지꿈" → pig-dream, "뱀에 물리는 꿈" → snake-bite-dream, "돈 줍는 꿈" → money-pickup-dream */
export function keywordToSlug(input: string): SlugifyResult {
  const trimmed = input.trim()
  if (!trimmed) return { slug: '', hasUnmatched: false }

  let rest = trimmed
  let hasDream = false
  if (rest.endsWith('꿈')) {
    hasDream = true
    rest = rest.slice(0, -1).trim()
  }

  const words = rest.split(/\s+/).filter(Boolean)
  const parts: string[] = []
  let hasUnmatched = false

  for (const word of words) {
    const { text, matched } = convertWord(word)
    if (matched) parts.push(text)
    else hasUnmatched = true
  }

  if (hasDream) parts.push('dream')

  return { slug: parts.join('-'), hasUnmatched }
}
