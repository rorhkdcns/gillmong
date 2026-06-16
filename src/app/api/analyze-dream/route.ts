import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
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
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  const { dream } = await req.json()
  if (!dream?.trim()) {
    return NextResponse.json({ error: '꿈 내용이 없습니다.' }, { status: 400 })
  }

  const prompt = `당신은 수십 년 경력의 전문 해몽가입니다. 사용자의 꿈을 분석하여 한국 전통 해몽, 아시아(중국·일본) 관점, 서양 심리학적 관점을 모두 포함한 전문적이고 풍부한 해석을 제공해주세요.

꿈 내용:
"""
${dream.trim()}
"""

분석 기준:
- 꿈 속 상징물의 문화권별 의미 해석
- 심리적 메시지와 무의식적 의미
- 길몽/흉몽 판정 (A등급에 가까울수록 좋은 꿈)
- 현실에서 적용 가능한 구체적 조언

아래 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만:
{
  "grade": "A",
  "type": "길몽",
  "title": "꿈을 한 줄로 표현한 제목 (20자 이내)",
  "summary": "꿈의 핵심 의미 요약 (2~3줄, 따뜻하고 신비로운 어조)",
  "interpretation": "한국 전통 해몽 관점:\\n(내용)\\n\\n아시아 관점 (중국·일본):\\n(내용)\\n\\n서양 심리학적 관점:\\n(내용)\\n\\n종합 해석:\\n(내용)",
  "advice": "이 꿈을 바탕으로 한 실생활 조언 (2~3문장, 구체적으로)",
  "lucky_numbers": [1, 7, 13, 27, 38, 45]
}

grade 기준: A=최고의 길몽, B=좋은 길몽, C=평범한 꿈, D=주의가 필요한 꿈, E=흉몽의 기운, F=해석 불가
type: "길몽" | "흉몽" | "중립" 중 하나`

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.75,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`[Gemini API error] model=${GEMINI_MODEL} status=${res.status} url=${GEMINI_URL}`)
    console.error('[Gemini API error body]', errText)
    return NextResponse.json({ error: `Gemini API 오류 (${res.status})` }, { status: 500 })
  }

  const geminiData = await res.json()
  const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let parsed: Record<string, unknown>
  try {
    // 혹시 마크다운 코드 펜스가 붙어도 제거
    const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    console.error('[JSON parse error]', rawText)
    return NextResponse.json({ error: '결과 파싱에 실패했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  const VALID_GRADES = ['A', 'B', 'C', 'D', 'E', 'F']
  const VALID_TYPES  = ['길몽', '흉몽', '중립']

  const result = {
    grade:          VALID_GRADES.includes(String(parsed.grade)) ? String(parsed.grade) : 'C',
    type:           VALID_TYPES.includes(String(parsed.type))   ? String(parsed.type)  : '중립',
    title:          String(parsed.title  ?? '').slice(0, 50),
    summary:        String(parsed.summary ?? ''),
    interpretation: String(parsed.interpretation ?? ''),
    advice:         String(parsed.advice ?? ''),
    lucky_numbers:  sanitizeLuckyNumbers(parsed.lucky_numbers),
  }

  return NextResponse.json(result)
}
