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
  // KST(UTC+9) 자정을 UTC로 환산
  const KST = 9 * 3600 * 1000
  const kstNow = new Date(Date.now() + KST)
  kstNow.setUTCHours(0, 0, 0, 0)
  const todayISO = new Date(kstNow.getTime() - KST).toISOString()

  const { data, error: adminError } = await admin
    .from('analysis_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayISO)
    .limit(DAILY_LIMIT + 1)

  const count = data?.length ?? 0
  const remaining = Math.max(0, DAILY_LIMIT - count)

  return NextResponse.json({ remaining })
}
