import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ remaining: null })

  const DAILY_LIMIT = 3
  const todayISO = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [logsRes, dreamsRes, savedRes] = await Promise.all([
    supabase.from('analysis_logs').select('id').eq('user_id', user.id).gte('created_at', todayISO).limit(DAILY_LIMIT),
    supabase.from('dreams').select('id').eq('user_id', user.id).gte('created_at', todayISO).limit(DAILY_LIMIT),
    supabase.from('saved_dreams').select('id').eq('user_id', user.id).gte('created_at', todayISO).limit(DAILY_LIMIT),
  ])
  const used = (logsRes.data?.length ?? 0) + (dreamsRes.data?.length ?? 0) + (savedRes.data?.length ?? 0)
  return NextResponse.json({ remaining: Math.max(0, DAILY_LIMIT - used) })
}
