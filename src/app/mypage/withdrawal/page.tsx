import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import WithdrawalForm from './_components/WithdrawalForm'

export const dynamic = 'force-dynamic'

export default async function WithdrawalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  // 포인트 잔액
  const { data: profileRow, error: profileErr } = await admin
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  if (profileErr) {
    console.error('출금 페이지 프로필 조회 오류:', profileErr.message)
  }

  const balance = profileRow?.points ?? 0

  // 출금 신청 내역
  const { data: history } = await admin
    .from('withdrawal_requests')
    .select('id, amount, bank_name, account_number, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:  { label: '처리 중',  color: 'text-amber-500' },
    approved: { label: '완료',     color: 'text-emerald-600' },
    rejected: { label: '반려',     color: 'text-red-400' },
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto w-full max-w-2xl space-y-4">

          {/* 헤더 */}
          <div className="flex items-center gap-3">
            <Link href="/mypage" className="text-[#777777] hover:text-[#01273A]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-[#01273A]">출금 신청</h1>
          </div>

          {/* 현재 잔액 */}
          <section className="border border-gray-200 bg-white p-5">
            <p className="mb-1 text-sm text-[#777777]">출금 가능 포인트</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#E07B2A]">{balance.toLocaleString()}</span>
              <span className="text-base text-[#777777]">P</span>
            </div>
          </section>

          {/* 출금 신청 폼 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <h2 className="mb-5 inline-block bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">신청 정보</h2>
            {balance < 5000 ? (
              <div className="rounded border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                출금 가능한 포인트가 부족합니다. (최소 5,000P)
              </div>
            ) : (
              <WithdrawalForm balance={balance} realName="" />
            )}
          </section>

          {/* 신청 내역 */}
          {(history ?? []).length > 0 && (
            <section className="border border-gray-200 bg-white p-5 md:p-8">
              <h2 className="mb-4 inline-block bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">신청 내역</h2>
              <ul className="divide-y divide-gray-100">
                {(history ?? []).map((row) => {
                  const st = STATUS_LABEL[row.status] ?? { label: row.status, color: 'text-gray-400' }
                  const date = new Date(row.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                  return (
                    <li key={row.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#333333]">{row.amount.toLocaleString()}P</p>
                        <p className="mt-0.5 text-xs text-[#999]">{row.bank_name} · {row.account_number} · {date}</p>
                      </div>
                      <span className={`text-sm font-semibold ${st.color}`}>{st.label}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
