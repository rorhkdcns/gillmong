import { NextRequest, NextResponse } from 'next/server'
import { runShopCollect } from '@/lib/cronTasks'

// GET /api/cron/shop-collect
// 개별 실행용 — 평소엔 /api/cron/daily-tasks 안에서 함께 호출됨
// 수집 이력이 오래된 카테고리/하위카테고리 순으로 골라 순차적으로 쿠팡 검색 → 신규 상품 저장
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const result = await runShopCollect()
  return NextResponse.json(result)
}
