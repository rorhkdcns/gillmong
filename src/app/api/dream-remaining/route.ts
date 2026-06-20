import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ remaining: null })

  const admin = createAdminClient()
  const DAILY_LIMIT = 3
  const todayISO = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const { data } = await admin
    .from('analysis_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayISO)
    .limit(DAILY_LIMIT + 1)

  return NextResponse.json({ remaining: Math.max(0, DAILY_LIMIT - (data?.length ?? 0)) })
}
