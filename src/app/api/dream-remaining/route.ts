import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ remaining: 3 })

  const DAILY_LIMIT = 3
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('analysis_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  const remaining = DAILY_LIMIT - (data?.length ?? 0)
  return NextResponse.json({ remaining: Math.max(0, remaining) })
}
