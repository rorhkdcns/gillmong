import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { username, email } = await req.json()

  if (!username?.trim() || !email?.trim()) {
    return NextResponse.json({ error: '아이디와 이메일을 모두 입력해주세요.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username.trim().toLowerCase())
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: '아이디 또는 이메일이 일치하지 않습니다.' }, { status: 404 })
  }

  const authEmail = `${username.trim().toLowerCase()}@gillmong.com`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: authEmail,
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
