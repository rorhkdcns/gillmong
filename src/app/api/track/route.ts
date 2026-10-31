import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyVisit } from '@/lib/trafficSource'

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const path = typeof b.path === 'string' ? b.path : '/'
    const row = classifyVisit({
      path,
      search: typeof b.search === 'string' ? b.search : '',
      referrer: typeof b.referrer === 'string' ? b.referrer : '',
    })
    if (row) await createAdminClient().from('site_visits').insert(row)
  } catch {
    // 통계 기록 실패가 사이트 동작에 영향을 주면 안 되므로 조용히 무시
  }
  return NextResponse.json({ ok: true })
}
