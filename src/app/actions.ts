'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

export type WithdrawalState = { error?: string; success?: boolean } | null

export async function withdrawalAction(
  _prev: WithdrawalState,
  formData: FormData
): Promise<WithdrawalState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const amount      = parseInt(((formData.get('amount') as string) ?? '0').replace(/,/g, ''), 10)
  const bankName    = ((formData.get('bank_name') as string) ?? '').trim()
  const accountNum  = ((formData.get('account_number') as string) ?? '').trim()
  const accountHolder = ((formData.get('account_holder') as string) ?? '').trim()

  if (!amount || amount < 5000)        return { error: '최소 출금 금액은 5,000P입니다.' }
  if (amount % 1000 !== 0)            return { error: '1,000P 단위로 신청 가능합니다.' }
  if (!bankName || !accountNum || !accountHolder) return { error: '은행 정보를 모두 입력해주세요.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  if (!profile || profile.points < amount)
    return { error: `포인트가 부족합니다. (보유: ${(profile?.points ?? 0).toLocaleString()}P)` }

  const { error } = await supabase.from('withdrawal_requests').insert({
    user_id:         user.id,
    amount,
    bank_name:       bankName,
    account_number:  accountNum,
    account_holder:  accountHolder,
    status:          'pending',
  })

  if (error) return { error: '신청 중 오류가 발생했습니다. 다시 시도해주세요.' }

  // 포인트 차감
  await supabase
    .from('profiles')
    .update({ points: profile.points - amount })
    .eq('id', user.id)

  revalidatePath('/mypage')
  revalidatePath('/mypage/withdrawal')
  return { success: true }
}
