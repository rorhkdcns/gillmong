import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ remaining: null })

  const DAILY_LIMIT = 3
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('analysis_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .limit(DAILY_LIMIT + 1)

  const remaining = DAILY_LIMIT - (data?.length ?? 0)
  return NextResponse.json({ remaining: Math.max(0, remaining) })
}
