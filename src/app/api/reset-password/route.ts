import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { username, email } = await req.json()

  if (!username?.trim() || !email?.trim()) {
    return NextResponse.json({ error: '아이디와 이메일을 모두 입력해주세요.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // username으로 profile 조회
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: '아이디 또는 이메일이 일치하지 않습니다.' }, { status: 404 })
  }

  // auth 유저 메타데이터에서 실제 이메일 검증
  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(profile.id)
  if (authErr || !authUser.user) {
    return NextResponse.json({ error: '아이디 또는 이메일이 일치하지 않습니다.' }, { status: 404 })
  }

  const storedEmail: string = (authUser.user.user_metadata?.email ?? '').trim().toLowerCase()
  const inputEmail = email.trim().toLowerCase()

  if (storedEmail !== inputEmail) {
    return NextResponse.json({ error: '아이디 또는 이메일이 일치하지 않습니다.' }, { status: 404 })
  }

  // 복구 링크 생성 — 공개 호스트에서 콜백 URL 구성
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.user.email!,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
    },
  })

  if (linkErr) {
    console.error('[reset-password] generateLink error:', linkErr.message)
    return NextResponse.json({ error: '링크 생성에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ link: linkData.properties?.action_link })
}
