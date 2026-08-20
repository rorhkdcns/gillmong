import { NextRequest, NextResponse } from 'next/server'
import { runDailyFortune } from '@/lib/cronTasks'

// GET /api/cron/daily-fortune
// 개별 실행용 — 평소엔 /api/cron/daily-tasks 안에서 함께 호출됨
// 오늘치(KST) 띠/별자리 운세가 아직 없으면 Gemini 호출로 채워넣는다.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const result = await runDailyFortune()
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}
