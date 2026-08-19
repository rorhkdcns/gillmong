import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ZODIAC_KEYS, STAR_KEYS, getKSTDateString, type FortuneType } from '@/lib/fortune'

export const maxDuration = 30

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const PROMPTS: Record<FortuneType, string> = {
  zodiac: `아래 12간지 띠 각각에 대해 오늘 하루의 운세를 2~3문장으로 써줘. 밝고 희망적인 톤으로, 뻔하지 않게 각 띠마다 다르게.

쥐, 소, 호랑이, 토끼, 용, 뱀, 말, 양, 원숭이, 닭, 개, 돼지

출력 형식 — 반드시 이 형식 그대로, 다른 설명 없이:
쥐: (운세 내용)
소: (운세 내용)
호랑이: (운세 내용)
토끼: (운세 내용)
용: (운세 내용)
뱀: (운세 내용)
말: (운세 내용)
양: (운세 내용)
원숭이: (운세 내용)
닭: (운세 내용)
개: (운세 내용)
돼지: (운세 내용)`,
  star: `아래 12별자리 각각에 대해 오늘 하루의 운세를 2~3문장으로 써줘. 밝고 희망적인 톤으로, 뻔하지 않게 각 별자리마다 다르게.

양자리, 황소자리, 쌍둥이자리, 게자리, 사자자리, 처녀자리, 천칭자리, 전갈자리, 사수자리, 염소자리, 물병자리, 물고기자리

출력 형식 — 반드시 이 형식 그대로, 다른 설명 없이:
양자리: (운세 내용)
황소자리: (운세 내용)
쌍둥이자리: (운세 내용)
게자리: (운세 내용)
사자자리: (운세 내용)
처녀자리: (운세 내용)
천칭자리: (운세 내용)
전갈자리: (운세 내용)
사수자리: (운세 내용)
염소자리: (운세 내용)
물병자리: (운세 내용)
물고기자리: (운세 내용)`,
}

const EXPECTED_KEYS: Record<FortuneType, string[]> = {
  zodiac: ZODIAC_KEYS,
  star: STAR_KEYS,
}

/** "이름: 내용" 형식의 줄들을 파싱한다. 12개가 정확히 기대한 key와 일치하지 않으면 null. */
function parseFortuneLines(raw: string, type: FortuneType): Map<string, string> | null {
  const expected = new Set(EXPECTED_KEYS[type])
  const result = new Map<string, string>()

  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([^:：]+?)\s*[:：]\s*(.+?)\s*$/)
    if (!match) continue
    const [, key, content] = match
    if (expected.has(key) && content) result.set(key, content)
  }

  if (result.size !== expected.size) return null
  for (const key of expected) {
    if (!result.has(key)) return null
  }
  return result
}

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  let res: Response | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9 },
      }),
    })
    if (res.ok || (res.status !== 503 && res.status !== 529)) break
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000))
  }

  if (!res || !res.ok) {
    const errText = await res?.text()
    console.error(`[DailyFortune] Gemini API 오류 status=${res?.status}`, errText)
    return null
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
}

// GET /api/cron/daily-fortune
// Vercel Cron이 매일 자정 직후(KST) 호출.
// 오늘치(KST) 띠/별자리 운세가 아직 없으면 Gemini 호출 2번으로 12개씩 한 번에 생성해 채워넣는다.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  const admin = createAdminClient()
  const today = getKSTDateString()
  const results: Record<FortuneType, 'skipped' | 'created' | 'failed'> = {
    zodiac: 'skipped',
    star: 'skipped',
  }

  for (const type of ['zodiac', 'star'] as FortuneType[]) {
    const { count } = await admin
      .from('daily_fortunes')
      .select('id', { count: 'exact', head: true })
      .eq('fortune_date', today)
      .eq('type', type)

    if ((count ?? 0) >= EXPECTED_KEYS[type].length) continue // 이미 오늘치 있음 — 스킵

    const raw = await callGemini(GEMINI_API_KEY, PROMPTS[type])
    if (!raw) {
      results[type] = 'failed'
      continue
    }

    const parsed = parseFortuneLines(raw, type)
    if (!parsed) {
      console.error(`[DailyFortune] 파싱 실패 (type=${type}), 응답:`, raw)
      results[type] = 'failed'
      continue
    }

    const rows = [...parsed.entries()].map(([key, content]) => ({
      fortune_date: today,
      type,
      key,
      content,
    }))

    const { error } = await admin.from('daily_fortunes').upsert(rows, { onConflict: 'fortune_date,type,key' })
    if (error) {
      console.error(`[DailyFortune] 저장 실패 (type=${type}):`, error.message)
      results[type] = 'failed'
      continue
    }

    results[type] = 'created'
  }

  console.log(`[DailyFortune] 완료 (${today}):`, results)
  return NextResponse.json({ date: today, results })
}
