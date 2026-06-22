'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const AMOUNTS = [5000, 10000, 30000, 50000, 100000, 200000]

declare global {
  interface Window {
    AUTHNICE?: { requestPay: (config: Record<string, unknown>) => void }
  }
}

export default function ChargePage() {
  const [amount, setAmount]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleCharge = async () => {
    if (amount === 0) { setError('충전 금액을 선택해주세요'); return }
    if (!window.AUTHNICE) { setError('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return }

    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().auth.getSession()
      const userId   = data?.session?.user?.id
      if (!userId) throw new Error('로그인이 필요합니다')

      console.log('[Charge] 결제 준비 요청:', { userId, amount })

      const res = await fetch('/api/payment/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, amount }),
      })
      if (!res.ok) throw new Error('결제 준비 실패')

      const pd = await res.json()
      console.log('[Charge] 결제 준비 완료:', pd)

      window.AUTHNICE.requestPay({
        clientId:   'R2_017e98e61ba345f298d6b497b6c52afa',
        method:     'card',
        orderId:    pd.orderId,
        amount:     pd.amount,
        goodsName:  '길몽상점 포인트',
        returnUrl:  pd.returnUrl,
        buyerName:  pd.buyerName,
        buyerEmail: pd.buyerEmail,
        fnError: (result: { errorMsg?: string }) => {
          console.error('[Charge] 결제창 오류:', result)
          alert(result.errorMsg ?? '결제 중 오류가 발생했습니다.')
          setLoading(false)
        },
      })
    } catch (err) {
      console.error('[Charge] 오류:', err)
      setError(err instanceof Error ? err.message : '오류 발생')
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://pay.nicepay.co.kr/v1/js/" strategy="lazyOnload" />
      <SiteHeader />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-[#01273A]">포인트 충전</h1>

        {error && (
          <div className="mb-5 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6">
          <h2 className="mb-3 text-xl font-bold text-[#01273A]">충전 금액 선택</h2>
          <div className="grid grid-cols-3 gap-2">
            {AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                disabled={loading}
                className={`rounded-lg border-2 py-4 text-center transition disabled:opacity-50 ${
                  amount === v
                    ? 'border-[#E07B2A] bg-orange-50'
                    : 'border-gray-200 hover:border-[#E07B2A] hover:bg-orange-50'
                }`}
              >
                <div className="text-lg font-bold text-[#E07B2A]">{v.toLocaleString()} P</div>
                <div className="text-sm text-gray-500">₩{v.toLocaleString()}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-lg bg-[#E07B2A] px-5 py-4">
          <span className="text-base font-bold text-white">총 충전액</span>
          <div className="mt-1 text-3xl font-bold text-white">
            {amount === 0 ? '금액을 선택해주세요' : `₩${amount.toLocaleString()}`}
          </div>
        </section>

        <button
          onClick={handleCharge}
          disabled={loading || amount === 0}
          className={`mb-6 w-full rounded-lg py-4 text-lg font-bold text-white transition ${
            loading || amount === 0
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-[#E07B2A] hover:brightness-90'
          }`}
        >
          {loading ? '결제 진행 중...' : amount === 0 ? '금액을 선택해주세요' : `₩${amount.toLocaleString()} 충전하기`}
        </button>

        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-base text-gray-600">
          <ul className="space-y-1.5">
            <li>• 충전된 포인트는 꿈 구매에 즉시 사용할 수 있습니다</li>
            <li>• 포인트 충전은 환불이 불가능하니 신중하게 선택해주세요</li>
            <li>• 결제 문의: 마이페이지 → 1:1 문의</li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/mypage" className="text-base text-[#E07B2A] hover:underline">
            마이페이지로 돌아가기
          </Link>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
