import { NextResponse } from 'next/server'
import { isAuthSessionMissingError, type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminAuthResult =
  | { ok: true; userId: string; admin: SupabaseClient }
  | { ok: false; response: NextResponse }

// Route Handler 전용 어드민 권한 체크. 실패 사유를 구분해 응답한다:
// session_error(세션 읽기 실패) / not_logged_in(로그인 안 됨) / not_admin(로그인은 됐으나 is_admin=false)
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const { data: { user }, error: sessionError } = await supabase.auth.getUser()

  // 쿠키가 없어 세션 자체가 없는 경우(AuthSessionMissingError)는 정상적인 "로그인 안 됨" 상태이지
  // 세션 조회 실패가 아니므로 not_logged_in으로 분류한다. 그 외의 에러만 실제 session_error로 취급.
  if (sessionError && !isAuthSessionMissingError(sessionError)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '세션을 확인할 수 없습니다.', reason: 'session_error' },
        { status: 401 },
      ),
    }
  }
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '로그인이 필요합니다.', reason: 'not_logged_in' },
        { status: 401 },
      ),
    }
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '권한 정보를 확인할 수 없습니다.', reason: 'session_error' },
        { status: 500 },
      ),
    }
  }
  if (!profile?.is_admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '관리자 권한이 없습니다.', reason: 'not_admin' },
        { status: 403 },
      ),
    }
  }

  return { ok: true, userId: user.id, admin }
}
