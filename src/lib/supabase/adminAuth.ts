import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { isAuthSessionMissingError, type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminAuthReason = 'not_logged_in' | 'session_error' | 'not_admin'

type AdminCheckResult =
  | { ok: true; userId: string; admin: SupabaseClient }
  | { ok: false; reason: AdminAuthReason; message: string }

const STATUS_BY_REASON: Record<AdminAuthReason, number> = {
  not_logged_in: 401,
  session_error: 401,
  not_admin: 403,
}

// 실패 사유를 구분한다: session_error(세션 읽기 실패) / not_logged_in(로그인 안 됨) / not_admin(로그인은 됐으나 is_admin=false)
async function checkAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient()
  const { data: { user }, error: sessionError } = await supabase.auth.getUser()

  // 쿠키가 없어 세션 자체가 없는 경우(AuthSessionMissingError)는 정상적인 "로그인 안 됨" 상태이지
  // 세션 조회 실패가 아니므로 not_logged_in으로 분류한다. 그 외의 에러만 실제 session_error로 취급.
  if (sessionError && !isAuthSessionMissingError(sessionError)) {
    return { ok: false, reason: 'session_error', message: '세션을 확인할 수 없습니다.' }
  }
  if (!user) {
    return { ok: false, reason: 'not_logged_in', message: '로그인이 필요합니다.' }
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { ok: false, reason: 'session_error', message: '권한 정보를 확인할 수 없습니다.' }
  }
  if (!profile?.is_admin) {
    return { ok: false, reason: 'not_admin', message: '관리자 권한이 없습니다.' }
  }

  return { ok: true, userId: user.id, admin }
}

export type AdminAuthResult =
  | { ok: true; userId: string; admin: SupabaseClient }
  | { ok: false; response: NextResponse }

// Route Handler(API)용
export async function requireAdmin(): Promise<AdminAuthResult> {
  const result = await checkAdmin()
  if (result.ok) return result
  return {
    ok: false,
    response: NextResponse.json(
      { error: result.message, reason: result.reason },
      { status: STATUS_BY_REASON[result.reason] },
    ),
  }
}

export type AdminAuthActionResult =
  | { ok: true; userId: string; admin: SupabaseClient }
  | { ok: false; error: string; reason: AdminAuthReason }

// Server Action('use server')용 — 액션들의 기존 { error } 반환 컨벤션에 맞춰 NextResponse 없이 반환
export async function requireAdminAction(): Promise<AdminAuthActionResult> {
  const result = await checkAdmin()
  if (result.ok) return result
  return { ok: false, error: result.message, reason: result.reason }
}

// Server Component(레이아웃 등)용 — 실패 시 즉시 redirect. 로그인 자체가 안 된 경우 로그인 페이지로,
// 로그인은 됐으나 관리자가 아닌 경우 홈으로 보낸다.
export async function requireAdminPage(): Promise<{ userId: string; admin: SupabaseClient }> {
  const result = await checkAdmin()
  if (result.ok) return result
  redirect(result.reason === 'not_admin' ? '/' : '/auth/login')
}
