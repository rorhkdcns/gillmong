import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import WithdrawConfirm from './_components/WithdrawConfirm'

export const dynamic = 'force-dynamic'

export default async function WithdrawPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto w-full max-w-lg space-y-6">

          <div className="flex items-center gap-3">
            <Link href="/mypage" className="text-[#777777] hover:text-[#01273A]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-[#01273A]">회원 탈퇴</h1>
          </div>

          <section className="rounded-2xl border border-red-200 bg-white p-6 md:p-8">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-black text-[#01273A]">정말로 탈퇴하시겠습니까?</h2>
              <p className="text-sm text-[#777777]">탈퇴 시 아래의 모든 데이터가 <span className="font-semibold text-red-500">영구 삭제</span>됩니다.</p>
            </div>

            <ul className="mb-8 space-y-2.5 rounded-xl bg-red-50 p-5 text-sm text-[#555555]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                <span>등록한 꿈 및 개인 저장 꿈 전체</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                <span>보유 포인트 및 충전·사용 내역</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                <span>구매 내역 및 출금 신청 내역</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                <span>꿈 해몽 횟수 기록</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                <span className="font-semibold text-red-600">삭제된 데이터는 복구가 불가능합니다.</span>
              </li>
            </ul>

            <WithdrawConfirm />
          </section>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
