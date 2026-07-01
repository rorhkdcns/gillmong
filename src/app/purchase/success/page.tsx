import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const dreamId      = sp.dreamId ?? ''
  const method       = sp.method  ?? ''
  const amount       = sp.amount  ? Number(sp.amount) : null
  const isVbank      = method === 'vbank'
  const vbankName    = sp.vbankName    ?? ''
  const vbankNumber  = sp.vbankNumber  ?? ''
  const vbankHolder  = sp.vbankHolder  ?? ''
  const vbankExpDate = sp.vbankExpDate
    ? new Date(sp.vbankExpDate).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    : ''

  return (
    <>
      <SiteHeader />

      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">

        {isVbank ? (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-10 w-10 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#01273A]">가상계좌 채번 완료</h1>
            <p className="mb-2 text-sm text-gray-500">입금 확인 후 꿈을 열람하실 수 있습니다</p>
            <p className="mb-6 text-xs text-amber-600 font-semibold">입금 완료까지 콘텐츠 열람이 제한될 수 있습니다</p>

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
          </>
        ) : (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#01273A]">구매 완료!</h1>
            {amount && (
              <p className="mb-1 text-2xl font-bold text-[#E07B2A]">₩{amount.toLocaleString()}</p>
            )}
            <p className="mb-1 text-sm text-gray-500">결제가 완료되었습니다. 콘텐츠를 바로 열람하실 수 있습니다.</p>
            <p className="mb-2 text-xs text-gray-400">7일 이내 구매확정 또는 환불요청이 가능합니다.</p>
            <p className="mb-8 text-xs text-amber-600">7일 경과 시 자동 구매확정되어 판매자에게 대금이 정산됩니다.</p>
          </>
        )}

        <div className="flex flex-col items-center gap-3">
          {dreamId && (
            <Link
              href={`/dream/${dreamId}`}
              className="inline-block rounded-xl bg-[#E07B2A] px-10 py-3 font-bold text-white hover:brightness-95"
            >
              꿈 내용 보기
            </Link>
          )}
          <Link
            href="/mypage"
            className="inline-block rounded-xl border border-[#01273A] px-10 py-3 font-bold text-[#01273A] hover:bg-[#01273A] hover:text-white transition"
          >
            마이페이지 확인
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:underline">홈으로</Link>
        </div>

      </main>

      <SiteFooter />
    </>
  )
}
