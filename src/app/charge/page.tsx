'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const AMOUNTS = [
  { points: 5000,   price: 5000 },
  { points: 10000,  price: 10000 },
  { points: 30000,  price: 30000 },
  { points: 50000,  price: 50000 },
  { points: 100000, price: 100000 },
  { points: 200000, price: 200000 },
]

const PAYMENT_METHODS = [
  { id: 'card',           label: '신용·체크카드', desc: '국내외 모든 카드' },
  { id: 'cardAndEasyPay', label: '간편결제',      desc: '카카오·네이버·PAYCO·삼성·SSG' },
  { id: 'cellphone',      label: '휴대폰 결제',   desc: '통신사 결제 (디지털 콘텐츠)' },
  { id: 'vbank',          label: '가상계좌',      desc: '무통장 입금 (72시간 유효)' },
]

// 할부 옵션 (5만원 이상 시 표시)
const QUOTA_OPTIONS = [
  { value: '00',                label: '일시불' },
  { value: '00:02:03',          label: '최대 3개월' },
  { value: '00:02:03:06',       label: '최대 6개월' },
  { value: '00:02:03:06:12',    label: '최대 12개월' },
  { value: '00:02:03:06:12:24', label: '최대 24개월' },
]

declare global {
  interface Window {
    AUTHNICE?: { requestPay: (config: Record<string, unknown>) => void }
  }
}

export default function ChargePage() {
  const [totalAmount, setTotalAmount] = useState(0)
  const [method, setMethod]           = useState('card')
  const [cardQuota, setCardQuota]     = useState('00:02:03:06:12')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function handleAdd(item: { price: number }) {
    setTotalAmount(prev => prev + item.price)
  }
  function handleClear() { setTotalAmount(0) }

  const handleCharge = async () => {
    if (totalAmount === 0) { setError('충전 금액을 선택해주세요'); return }
    if (!window.AUTHNICE)  { setError('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return }

    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data }         = await createClient().auth.getSession()
      const userId           = data?.session?.user?.id
      if (!userId) throw new Error('로그인이 필요합니다')

      const res = await fetch('/api/payment/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId,
          amount:        totalAmount,
          paymentMethod: method,
          cardQuota:     method === 'card' ? cardQuota : undefined,
        }),
      })
      if (!res.ok) throw new Error('결제 준비 실패')

      const pd = await res.json()

      const config: Record<string, unknown> = {
        clientId:  pd.clientId,
        method:    pd.paymentMethod ?? method,
        orderId:   pd.orderId,
        amount:    pd.amount,
        goodsName: pd.goodsName,
        returnUrl: pd.returnUrl,
        buyerName: pd.buyerName,
        buyerTel:  pd.buyerTel,
        buyerEmail: pd.buyerEmail,
        fnError:   (result: { errorMsg?: string }) => {
          setError(result.errorMsg ?? '결제창 오류가 발생했습니다.')
          setLoading(false)
        },
      }

      // 결제수단별 추가 옵션
      if (method === 'card' && cardQuota) config.cardQuota = pd.cardQuota ?? cardQuota
      if (method === 'vbank') {
        config.vbankHolder     = pd.vbankHolder
        config.vbankValidHours = pd.vbankValidHours
      }
      if (method === 'cellphone') config.isDigital = true

      window.AUTHNICE.requestPay(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생')
      setLoading(false)
    }
  }

  const showQuota = method === 'card' && totalAmount >= 50000

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

        {/* 충전 금액 선택 */}
        <section className="mb-6">
          <h2 className="mb-3 text-xl font-bold text-[#01273A]">충전 금액 선택</h2>
          <div className="grid grid-cols-3 gap-2">
            {AMOUNTS.map((item) => (
              <button
                key={item.price}
                onClick={() => handleAdd(item)}
                disabled={loading}
                className="rounded-lg border-2 border-gray-200 py-4 text-center transition hover:border-[#E07B2A] hover:bg-orange-50 disabled:opacity-50"
              >
                <div className="text-lg font-bold text-[#E07B2A]">+{item.points.toLocaleString()} P</div>
                <div className="text-sm text-gray-500">₩{item.price.toLocaleString()}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 총 충전액 */}
        <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-base font-bold text-[#01273A]">총 충전액</span>
            {totalAmount > 0 && (
              <button onClick={handleClear} className="text-sm text-gray-400 underline hover:text-red-400">
                초기화
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#01273A]">₩{totalAmount.toLocaleString()}</span>
            <span className="text-xl font-bold text-[#E07B2A]">{totalAmount.toLocaleString()} P</span>
          </div>
        </section>

        {/* 결제수단 선택 */}
        <section className="mb-6">
          <h2 className="mb-3 text-xl font-bold text-[#01273A]">결제수단 선택</h2>
          <div className="grid grid-cols-1 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 rounded-lg border-2 px-4 py-4 text-left transition ${
                  method === m.id
                    ? 'border-[#01273A] bg-[#01273A]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className={`text-base font-bold ${method === m.id ? 'text-[#01273A]' : 'text-gray-700'}`}>
                    {m.label}
                  </div>
                  <div className="text-sm text-gray-400">{m.desc}</div>
                </div>
                {method === m.id && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#01273A]">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 할부 선택 (카드 + 5만원 이상) */}
        {showQuota && (
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-[#01273A]">할부 옵션</h2>
            <select
              value={cardQuota}
              onChange={(e) => setCardQuota(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-base text-gray-700 outline-none focus:border-[#01273A]"
            >
              {QUOTA_OPTIONS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-400">* 실제 할부 가능 개월은 카드사 정책에 따라 다를 수 있습니다</p>
          </section>
        )}

        {/* 가상계좌 안내 */}
        {method === 'vbank' && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800">
            채번 후 72시간 내에 입금하면 포인트가 자동 충전됩니다. 입금 전까지는 포인트가 지급되지 않습니다.
          </div>
        )}

        {/* 충전 버튼 */}
        <button
          onClick={handleCharge}
          disabled={loading || totalAmount === 0}
          className={`mb-6 w-full rounded-lg py-4 text-lg font-bold text-white transition ${
            loading || totalAmount === 0
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-[#E07B2A] hover:brightness-90'
          }`}
        >
          {loading ? '결제 진행 중...' : totalAmount === 0 ? '금액을 선택해주세요' : `₩${totalAmount.toLocaleString()} 충전하기`}
        </button>

        {/* 안내 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-base text-gray-600">
          <ul className="space-y-1.5">
            <li>• 충전된 포인트는 꿈 구매에 즉시 사용할 수 있습니다</li>
            <li>• 포인트 충전은 환불이 불가능하니 신중하게 선택해주세요</li>
            <li>• 가상계좌는 채번 후 72시간 내 입금 시 포인트가 충전됩니다</li>
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
