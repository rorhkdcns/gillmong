import { NextRequest, NextResponse } from 'next/server'
import { runAffiliateHealth } from '@/lib/cronTasks'

// GET /api/cron/affiliate-health
// 개별 실행용 — 평소엔 /api/cron/daily-tasks 안에서 함께 호출됨
// 활성 제휴상품을 오래된 순으로 재조회해 품절/판매중지 상품을 자동 비활성화
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const result = await runAffiliateHealth()
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}
