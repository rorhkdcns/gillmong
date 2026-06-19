'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const username = ((formData.get('username') as string) ?? '').trim().toLowerCase()
  const password = (formData.get('password') as string) ?? ''
  const email = `${username}@gillmong.com`

  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !signInData.user) {
    return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
  }

  let isAdmin = false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', signInData.user.id)
      .single()
    isAdmin = !!profile?.is_admin
  } catch {
    // 프로필 조회 실패해도 로그인은 성공
  }

  redirect(isAdmin ? '/admin' : '/')
}
