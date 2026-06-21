import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ChargeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string }>
}) {
  const { amount } = await searchParams
  const charged = amount ? Number(amount) : null

  return (
    <>
      <SiteHeader />

      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-[#01273A]">포인트 충전 완료!</h1>
        {charged && (
          <p className="mb-1 text-xl font-bold text-[#E07B2A]">
            {charged.toLocaleString()} P
          </p>
        )}
        <p className="mb-1 text-sm text-gray-500">포인트가 정상적으로 충전되었습니다.</p>
        <p className="mb-10 text-sm text-gray-400">마이페이지에서 포인트를 확인하실 수 있습니다.</p>

        <Link
          href="/mypage"
          className="mb-4 inline-block rounded-xl bg-[#E07B2A] px-10 py-3 font-bold text-white hover:brightness-95"
        >
          마이페이지 확인
        </Link>
        <Link href="/" className="text-sm text-[#E07B2A] hover:underline">
          홈으로 돌아가기
        </Link>
      </main>

      <SiteFooter />
    </>
  )
}
