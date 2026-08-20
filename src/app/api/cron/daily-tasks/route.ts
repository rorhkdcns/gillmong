import { NextRequest, NextResponse } from 'next/server'
import { runAutoSettle, runAffiliateHealth, runShopCollect, runDailyFortune } from '@/lib/cronTasks'

// Hobby 요금제는 cron 항목이 하루 1번만 도는 게 안전하므로, 여러 일일 작업을 이 하나의
// 크론에 몰아서 순서대로 실행한다. 하나가 실패해도 나머지는 계속 진행된다.
export const maxDuration = 300

type TaskStatus = { status: 'ok' | 'error'; result?: unknown; error?: string }

async function runTask(name: string, task: () => Promise<unknown>): Promise<TaskStatus> {
  try {
    const result = await task()
    if (result && typeof result === 'object' && 'error' in result) {
      console.error(`[DailyTasks] ${name} 실패:`, (result as { error: unknown }).error)
      return { status: 'error', result }
    }
    return { status: 'ok', result }
  } catch (e) {
    console.error(`[DailyTasks] ${name} 예외:`, e)
    return { status: 'error', error: e instanceof Error ? e.message : String(e) }
  }
}

// GET /api/cron/daily-tasks
// Vercel Cron이 하루 1번(KST 00:10) 호출.
// auto-settle → affiliate-health → shop-collect → daily-fortune 순으로 실행.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const autoSettle = await runTask('autoSettle', runAutoSettle)
  const affiliateHealth = await runTask('affiliateHealth', runAffiliateHealth)
  const shopCollect = await runTask('shopCollect', runShopCollect)
  const dailyFortune = await runTask('dailyFortune', runDailyFortune)

  const summary = { autoSettle, affiliateHealth, shopCollect, dailyFortune }
  console.log('[DailyTasks] 완료:', {
    autoSettle: autoSettle.status,
    affiliateHealth: affiliateHealth.status,
    shopCollect: shopCollect.status,
    dailyFortune: dailyFortune.status,
  })

  return NextResponse.json(summary)
}
