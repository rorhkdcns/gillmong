import { NextRequest, NextResponse } from 'next/server'
import { runAutoSettle } from '@/lib/cronTasks'

// GET /api/cron/auto-settle
// 개별 실행용 — 평소엔 /api/cron/daily-tasks 안에서 함께 호출됨
// confirm_deadline이 지난 paid_escrow 주문을 자동 settled 처리
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const result = await runAutoSettle()
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}
