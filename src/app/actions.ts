'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // DB 작업은 admin 클라이언트로 RLS 우회 (유저 인증은 위에서 완료)
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  if (!profile || profile.points < amount)
    return { error: `포인트가 부족합니다. (보유: ${(profile?.points ?? 0).toLocaleString()}P)` }

  const { error } = await admin.from('withdrawal_requests').insert({
    user_id:         user.id,
    amount,
    bank_name:       bankName,
    account_number:  accountNum,
    account_holder:  accountHolder,
    status:          'pending',
  })

  if (error) return { error: `신청 중 오류가 발생했습니다. (${error.message})` }

  // 포인트 차감
  await admin
    .from('profiles')
    .update({ points: profile.points - amount })
    .eq('id', user.id)

  revalidatePath('/mypage')
  revalidatePath('/mypage/withdrawal')
  return { success: true }
}

export async function getMyWithdrawals(): Promise<Array<{
  id: number; amount: number; bank_name: string; status: string; created_at: string
}>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const admin = createAdminClient()
  const { data } = await admin
    .from('withdrawal_requests')
    .select('id, amount, bank_name, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return data ?? []
}
