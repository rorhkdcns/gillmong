import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function fallbackLuckyNumbers(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  const result: number[] = []
  while (result.length < 6) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result.sort((a, b) => a - b)
}

function sanitizeLuckyNumbers(raw: unknown): number[] {
  if (!Array.isArray(raw)) return fallbackLuckyNumbers()
  const nums = [...new Set(raw.map(Number).filter((n) => n >= 1 && n <= 45 && Number.isInteger(n)))]
  if (nums.length < 6) return fallbackLuckyNumbers()
  return nums.slice(0, 6).sort((a, b) => a - b)
}

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const DAILY_LIMIT = 3
  // KST(UTC+9) 자정을 UTC로 환산
  const KST = 9 * 3600 * 1000
  const kstNow = new Date(Date.now() + KST)
  kstNow.setUTCHours(0, 0, 0, 0)
  const todayISO = new Date(kstNow.getTime() - KST).toISOString()
  const { data: todayLogs } = await admin
    .from('analysis_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayISO)
    .limit(DAILY_LIMIT)
  if ((todayLogs?.length ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: '오늘 사용 횟수(3회)를 모두 사용했습니다.' }, { status: 429 })
  }

  const body = await req.json()
  const answers = body.answers as { who?: string; when?: string; how?: string; memory?: string } | undefined
  const hasInput = answers && Object.values(answers).some((v) => typeof v === 'string' && v.trim())
  if (!hasInput) {
    return NextResponse.json({ error: '꿈 내용이 없습니다.' }, { status: 400 })
  }

  const who    = answers?.who?.trim()    || '(없음)'
  const when   = answers?.when?.trim()   || '(없음)'
  const how    = answers?.how?.trim()    || '(없음)'
  const memory = answers?.memory?.trim() || '(없음)'

  const prompt = `너는 한국 전통 해몽, 동양(중국/일본) 철학적 해몽, 서양 융/프로이트 심리학적 꿈 해석을 모두 통달한 30년 경력의 전문 해몽가야.

아래 4가지 꿈 단서를 자연스러운 하나의 꿈 이야기로 재구성한 뒤, 그 꿈을 해몽해줘.

【꿈 단서】
- 누가/무엇이: ${who}
- 언제/어디서: ${when}
- 어떻게/왜: ${how}
- 강렬한 기억: ${memory}

꿈의 각 요소를 깊이 분석하되, 아래 문화권별 해몽 원칙을 반드시 지켜야 해:
- 한국 전통: 죽는 꿈은 길몽(재물·변화의 상징), 이가 빠지는 꿈은 흉몽(가족 우환 암시), 돼지꿈은 길몽, 뱀꿈은 재물 또는 위험 양면성 등 민간 전통 해몽을 정확히 적용
- 동양(중국·일본): 오행, 음양, 상징물의 길흉 의미를 철학적으로 해석
- 서양 심리학: 융의 원형(Shadow, Anima, Animus, Self)과 프로이트의 무의식·욕망 이론을 적용

절대 모든 꿈을 긍정적으로만 해석하지 마. 꿈의 맥락, 감정, 분위기에 따라 정직하게 길몽/흉몽/중립을 판정해.
흉몽이나 경고성 꿈은 솔직하게 흉몽으로 판정하되, 대처 방법을 함께 제시해.

아래 JSON 형식으로만 응답해. 다른 설명 없이 JSON만:
{
  "reconstructedDream": "4가지 단서를 바탕으로 재구성한 자연스러운 꿈 이야기 (3~5문장, 1인칭 서술)",
  "alphabet": "A",
  "type": "길몽",
  "title": "꿈을 한 줄로 표현한 제목 (20자 이내)",
  "summary": "꿈의 핵심을 1~2줄로 요약",
  "interpretation": "한국 전통 해몽 관점:\\n(내용)\\n\\n아시아 관점 (중국·일본):\\n(내용)\\n\\n서양 심리학적 관점:\\n(내용)\\n\\n종합 해석:\\n(내용)",
  "advice": "이 꿈을 바탕으로 한 실생활 조언 (2~3문장, 흉몽이면 주의사항 포함)",
  "lucky_numbers": [1, 7, 13, 27, 38, 45]
}

alphabet: 반드시 A, B, C, D, E 중 하나만 사용. 다른 알파벳은 절대 사용 금지. — A=최고의 길몽(풍요·성공·행운), B=좋은 길몽(축복·성장·희망), C=평범한 꿈(중립·변화·일상), D=주의가 필요한 꿈(경고·부담·위험 암시), E=흉몽(두려움·상실·불안)
type: "길몽" | "흉몽" | "중립" 중 하나`

  // 버튼 누른 시점에 횟수 차감 (Gemini 성공 여부와 무관)
  const { error: logError } = await admin.from('analysis_logs').insert({ user_id: user.id })
  if (logError) console.error('[analysis_logs insert error]', logError.message)
  else console.log('[analysis_logs insert] 성공 userId:', user.id.slice(0, 8))

  const reqBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.75, responseMimeType: 'application/json' },
  })

  let res: Response | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: reqBody,
    })
    if (res.ok || (res.status !== 503 && res.status !== 529)) break
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000))
  }

  if (!res || !res.ok) {
    const errText = await res?.text()
    console.error(`[Gemini API error] model=${GEMINI_MODEL} status=${res?.status}`)
    console.error('[Gemini API error body]', errText)
    if (res?.status === 503 || res?.status === 529) {
      return NextResponse.json(
        { error: '서버가 혼잡합니다. 잠시 후 다시 시도해주세요.', retryable: true },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: `잠시 후 다시 시도해주세요. (Gemini API 오류 ${res?.status})` },
      { status: 500 }
    )
  }

  const geminiData = await res.json()
  const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let parsed: Record<string, unknown>
  try {
    const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    console.error('[JSON parse error]', rawText)
    return NextResponse.json({ error: '결과 파싱에 실패했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  const VALID_ALPHA  = ['A', 'B', 'C', 'D', 'E']
  const VALID_TYPES  = ['길몽', '흉몽', '중립']

  const result = {
    reconstructedDream: String(parsed.reconstructedDream ?? '').trim() || `${who} / ${when} / ${how} / ${memory}`,
    alphabet:       VALID_ALPHA.includes(String(parsed.alphabet)) ? String(parsed.alphabet) : 'C',
    type:           VALID_TYPES.includes(String(parsed.type))  ? String(parsed.type)   : '중립',
    title:          String(parsed.title  ?? '').slice(0, 50),
    summary:        String(parsed.summary ?? ''),
    interpretation: String(parsed.interpretation ?? ''),
    advice:         String(parsed.advice ?? ''),
    lucky_numbers:  sanitizeLuckyNumbers(parsed.lucky_numbers),
  }

  return NextResponse.json({ ...result, _insertError: logError?.message ?? null })
}
