import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function ChargeCancelPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-[#01273A]">결제가 취소되었습니다</h1>
        <p className="mb-10 text-sm text-gray-500">안전한 환경에서 다시 시도해주세요.</p>

        <Link
          href="/charge"
          className="mb-4 inline-block rounded-xl bg-[#E07B2A] px-10 py-3 font-bold text-white hover:brightness-95"
        >
          다시 충전하기
        </Link>
        <Link href="/" className="text-sm text-[#E07B2A] hover:underline">
          홈으로 돌아가기
        </Link>
      </main>

      <SiteFooter />
    </>
  )
}
