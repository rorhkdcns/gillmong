import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function ChargeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const method      = sp.method ?? ''
  const amount      = sp.amount ? Number(sp.amount) : null
  const isVbank     = method === 'vbank'
  const vbankName   = sp.vbankName   ?? ''
  const vbankNumber = sp.vbankNumber ?? ''
  const vbankHolder = sp.vbankHolder ?? ''
  const vbankExpDate = sp.vbankExpDate
    ? new Date(sp.vbankExpDate).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    : ''

  return (
    <>
      <SiteHeader />

      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">

        {isVbank ? (
          /* 가상계좌 입금 대기 */
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-10 w-10 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#01273A]">가상계좌 채번 완료</h1>
            <p className="mb-6 text-sm text-gray-500">아래 계좌로 입금하시면 포인트가 자동 충전됩니다</p>

            <div className="mb-8 w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">은행명</dt>
                  <dd className="font-bold text-[#01273A]">{vbankName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">계좌번호</dt>
                  <dd className="font-bold text-[#01273A]">{vbankNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예금주</dt>
                  <dd className="font-bold text-[#01273A]">{vbankHolder}</dd>
                </div>
                {amount && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">입금 금액</dt>
                    <dd className="font-bold text-[#E07B2A]">₩{amount.toLocaleString()}</dd>
                  </div>
                )}
                {vbankExpDate && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">입금 기한</dt>
                    <dd className="font-semibold text-red-500">{vbankExpDate}</dd>
                  </div>
                )}
              </dl>
            </div>
            <p className="mb-8 text-xs text-gray-400">입금 확인 후 포인트가 자동으로 지급됩니다 (최대 수 분 소요)</p>
          </>
        ) : (
          /* 즉시 결제 완료 */
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#01273A]">포인트 충전 완료!</h1>
            {amount && (
              <p className="mb-1 text-2xl font-bold text-[#E07B2A]">{amount.toLocaleString()} P</p>
            )}
            <p className="mb-1 text-sm text-gray-500">포인트가 정상적으로 충전되었습니다.</p>
            <p className="mb-8 text-sm text-gray-400">마이페이지에서 포인트를 확인하실 수 있습니다.</p>
          </>
        )}

        <Link
          href="/mypage"
          className="mb-3 inline-block rounded-xl bg-[#E07B2A] px-10 py-3 font-bold text-white hover:brightness-95"
        >
          마이페이지 확인
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:underline">홈으로</Link>

      </main>

      <SiteFooter />
    </>
  )
}
