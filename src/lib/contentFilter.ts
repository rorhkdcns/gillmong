export type FilterVerdict = 'ALLOW' | 'ADULT' | 'BLOCK'
export type FilterContext = 'interpret' | 'listing'

export interface FilterResult {
  verdict: FilterVerdict
  passed: boolean
  isAdult: boolean
  needsSupport: boolean
  message?: string
}

interface GeminiResponseLike {
  promptFeedback?: { blockReason?: string }
  candidates?: Array<{
    finishReason?: string
    content?: { parts?: Array<{ text?: string }> }
  }>
}

const BLOCK_MESSAGE = '부적절한 표현이 포함되어 있습니다. 내용을 수정한 후 다시 시도해주세요.'
const ADULT_LISTING_MESSAGE = '표현 수위가 높아 판매 등록은 어렵습니다.\n상황 위주로 간결하게 다시 작성해주세요.'

export const SUPPORT_NOTICE =
  '반복되는 악몽이 일상에 영향을 준다면 전문가와 상담해보시는 것도 도움이 됩니다. (여성긴급전화 1366 / 정신건강상담 1577-0199)'

export const INTERPRETER_GUIDANCE =
  '성적인 내용이 포함된 꿈이라도 한국 전통 해몽의 성몽(性夢) 해석과 프로이트·융의 상징 이론 관점에서 담백하고 전문적으로 풀이해줘. 성적인 장면을 재서술하거나 확대 묘사하지 말고, 민망해하거나 훈계하는 태도를 취하지 마.'

export const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
]

// (a) 거래 알선어 — 사전 등재어지만 꿈 묘사가 아니라 거래 성사 어휘라 유지
const TRANSACTION_BLOCK = /조건만남|원조교제|성매매|출장안마/
// (b) 불법촬영물 관련어
const ILLEGAL_CONTENT_BLOCK = /불법촬영|몰카|딥페이크|리벤지\s*포르노|아청/
// (d) 욕설 — "새끼" 단독은 절대 포함하지 않음 ("돼지 새끼" 오탐 방지)
const PROFANITY_BLOCK = /씨발|시발|개새끼|병신|지랄|미친놈|미친년/
// (e) 상담 안내 신호 — 차단하지 않고 needsSupport 플래그만 세움
const SUPPORT_SIGNALS = /강간|성폭행|성추행|끌려가|저항했|트라우마/

// (c) 미성년 조합 판정용 신호. 단독 차단에는 절대 쓰지 않는다 — 동시 출현할 때만 BLOCK.
const MINOR_SIGNALS = /(초등|중학|고등)학(생|교)|미성년|아동|유아|어린이|여학생|남학생|로리|쇼타/
export const SEXUAL_CONTEXT_SIGNALS = /성관계|섹스|자위|성기|애무|삽입|나체|알몸|음란|야동|야설/

function hardBlockCheck(text: string): { blocked: boolean; needsSupport: boolean } {
  const needsSupport = SUPPORT_SIGNALS.test(text)

  if (TRANSACTION_BLOCK.test(text)) return { blocked: true, needsSupport }
  if (ILLEGAL_CONTENT_BLOCK.test(text)) return { blocked: true, needsSupport }
  if (MINOR_SIGNALS.test(text) && SEXUAL_CONTEXT_SIGNALS.test(text)) return { blocked: true, needsSupport }
  if (PROFANITY_BLOCK.test(text)) return { blocked: true, needsSupport }

  return { blocked: false, needsSupport }
}

/** @deprecated 하드블록 판정만 수행하는 호환용 함수. 신규 코드는 filterDreamInput을 사용할 것. */
export function hasInappropriateContent(text: string): boolean {
  return hardBlockCheck(text).blocked
}

export function isBlockedResponse(data: GeminiResponseLike): boolean {
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason
  const blockReason = data.promptFeedback?.blockReason
  const text = candidate?.content?.parts?.[0]?.text
  return finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT' || !!blockReason || !text
}

const CLASSIFIER_MODEL = 'gemini-2.5-flash'
const CLASSIFIER_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${CLASSIFIER_MODEL}:generateContent`

function buildClassifierPrompt(text: string): string {
  return `너는 꿈 해몽 서비스의 성인 콘텐츠 분류기야. 아래 꿈 내용을 읽고 ALLOW, ADULT, BLOCK 중 하나만 출력해. 다른 말은 절대 하지 마.

ALLOW: 키스나 포옹, 구체적 묘사 없이 관계를 맺은 꿈, 나체나 성적인 감정의 언급, 연예인·전 연인이 등장하는 성적인 꿈, 성폭력 피해를 당하는 꿈
ADULT: 신체 부위나 성행위를 구체적이고 반복적으로 묘사
BLOCK: 미성년자를 성적으로 대상화, 성매매 알선, 연락처 노출, 실존 인물을 실명으로 지목한 노골적 묘사, 성폭력 가해 미화

꿈 내용: "${text}"

분류:`
}

async function classifyWithGemini(text: string): Promise<FilterVerdict> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return 'ALLOW'

  try {
    const res = await fetch(`${CLASSIFIER_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildClassifierPrompt(text) }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 16 },
        safetySettings: SAFETY_SETTINGS,
      }),
    })

    if (!res.ok) return 'ALLOW'

    const data: GeminiResponseLike = await res.json()
    if (isBlockedResponse(data)) return 'ADULT'

    const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim().toUpperCase()
    if (raw.includes('BLOCK')) return 'BLOCK'
    if (raw.includes('ADULT')) return 'ADULT'
    return 'ALLOW'
  } catch {
    return 'ALLOW'
  }
}

export async function filterDreamInput(
  text: string,
  context: FilterContext = 'interpret',
): Promise<FilterResult> {
  const { blocked, needsSupport } = hardBlockCheck(text)
  if (blocked) {
    return { verdict: 'BLOCK', passed: false, isAdult: false, needsSupport, message: BLOCK_MESSAGE }
  }

  const verdict = await classifyWithGemini(text)

  if (verdict === 'BLOCK') {
    return { verdict, passed: false, isAdult: false, needsSupport, message: BLOCK_MESSAGE }
  }

  if (verdict === 'ADULT') {
    if (context === 'listing') {
      return { verdict, passed: false, isAdult: true, needsSupport, message: ADULT_LISTING_MESSAGE }
    }
    return { verdict, passed: true, isAdult: true, needsSupport }
  }

  return { verdict: 'ALLOW', passed: true, isAdult: false, needsSupport }
}
