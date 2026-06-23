'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const AMOUNTS = [5000, 10000, 30000, 50000, 100000, 200000]

const METHODS = [
  { id: 'card',       label: '신용·체크카드', desc: '국내외 모든 카드',   group: 'general' },
  { id: 'bank',       label: '계좌이체',       desc: '실시간 계좌이체',   group: 'general' },
  { id: 'vbank',      label: '가상계좌',        desc: '72시간 내 입금',    group: 'general' },
  { id: 'cellphone',  label: '휴대폰',          desc: '휴대폰 소액결제',   group: 'general' },
  { id: 'kakaopay',   label: '카카오페이',      desc: 'Kakao Pay',         group: 'simple'  },
  { id: 'naverpay',   label: '네이버페이',      desc: 'Naver Pay',         group: 'simple'  },
  { id: 'payco',      label: 'PAYCO',           desc: 'PAYCO 간편결제',    group: 'simple'  },
  { id: 'samsungpay', label: '삼성페이',        desc: 'Samsung Pay',       group: 'simple'  },
  { id: 'ssgpay',     label: 'SSGPAY',          desc: 'SSG Pay',           group: 'simple'  },
] as const

type MethodId = typeof METHODS[number]['id']

declare global {
  interface Window {
    AUTHNICE?: { requestPay: (config: Record<string, unknown>) => void }
  }
}

export default function ChargePage() {
  const [amount, setAmount]   = useState(0)
  const [method, setMethod]   = useState<MethodId>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!loading) return
    const handleFocus = () => {
      setTimeout(() => setLoading((prev) => { if (prev) { console.log('[Charge] 팝업 닫힘 감지, loading 해제') } return false }), 800)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading])

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

      console.log('[Charge] 결제 준비 요청:', { userId, amount, method })

      const res = await fetch('/api/payment/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, amount, paymentMethod: method }),
      })
      if (!res.ok) throw new Error('결제 준비 실패')

      const pd = await res.json()
      console.log('[Charge] 결제 준비 완료:', pd)

      const config: Record<string, unknown> = {
        clientId:   'R2_017e98e61ba345f298d6b497b6c52afa',
        method,
        orderId:    pd.orderId,
        amount:     pd.amount,
        goodsName:  '길몽상점 포인트',
        returnUrl:  pd.returnUrl,
        buyerName:  pd.buyerName,
        buyerEmail: pd.buyerEmail,
        fnError: (result: { errorMsg?: string }) => {
          console.error('[Charge] 결제창 오류/취소:', result)
          alert(result.errorMsg ?? '결제 중 오류가 발생했습니다.')
          setLoading(false)
        },
      }

      if (method === 'vbank') {
        config.vbankHolder     = '길몽상점'
        config.vbankValidHours = 72
      }

      window.AUTHNICE.requestPay(config)
    } catch (err) {
      console.error('[Charge] 오류:', err)
      setError(err instanceof Error ? err.message : '오류 발생')
      setLoading(false)
    }
  }

  const generalMethods = METHODS.filter(m => m.group === 'general')
  const simpleMethods  = METHODS.filter(m => m.group === 'simple')

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
            {AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(prev => prev + v)}
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

        {/* 총 충전액 */}
        <section className="mb-6 rounded-lg bg-[#01273A] px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">총 충전액</span>
            {amount > 0 && (
              <button
                onClick={() => setAmount(0)}
                disabled={loading}
                className="rounded border-2 border-white bg-white px-3 py-1 text-sm font-semibold text-[#01273A] transition hover:bg-[#01273A] hover:text-white disabled:opacity-50"
              >
                초기화
              </button>
            )}
          </div>
          <div className="mt-1 text-3xl font-bold text-white">
            {amount === 0 ? '금액을 선택해주세요' : `₩${amount.toLocaleString()}`}
          </div>
        </section>

        {/* 결제수단 선택 */}
        <section className="mb-6">
          <h2 className="mb-3 text-xl font-bold text-[#01273A]">결제수단 선택</h2>

          {/* 일반 결제 */}
          <div className="mb-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">일반 결제</p>
            <div className="grid grid-cols-2 gap-2">
              {generalMethods.map((m) => (
                <MethodButton key={m.id} m={m} selected={method === m.id} loading={loading} onClick={() => setMethod(m.id)} />
              ))}
            </div>
          </div>

          <div className="my-4 border-t border-gray-100" />

          {/* 간편결제 */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">간편결제</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {simpleMethods.map((m) => (
                <SimpleMethodButton key={m.id} m={m} selected={method === m.id} loading={loading} onClick={() => setMethod(m.id)} />
              ))}
            </div>
          </div>

          {method === 'vbank' && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              채번 후 72시간 내에 입금하면 포인트가 자동 충전됩니다. 입금 전까지는 포인트가 지급되지 않습니다.
            </div>
          )}
          {method === 'cellphone' && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              휴대폰 소액결제는 월 한도가 적용됩니다. 통신사 정책에 따라 제한될 수 있습니다.
            </div>
          )}
        </section>

        {/* 충전 버튼 */}
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

function MethodButton({
  m, selected, loading, onClick,
}: {
  m: { id: string; label: string; desc: string }
  selected: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition disabled:opacity-50 ${
        selected
          ? 'border-[#01273A] bg-[#01273A]/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex-1">
        <div className={`text-sm font-bold ${selected ? 'text-[#01273A]' : 'text-gray-700'}`}>
          {m.label}
        </div>
        <div className="text-xs text-gray-400">{m.desc}</div>
      </div>
      {selected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#01273A]">
          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  )
}

function SimpleMethodButton({
  m, selected, loading, onClick,
}: {
  m: { id: string; label: string }
  selected: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded-lg border-2 py-3 text-center text-sm font-bold transition disabled:opacity-50 ${
        selected
          ? 'border-[#01273A] bg-[#01273A] text-white'
          : 'border-gray-200 text-gray-700 hover:border-gray-300'
      }`}
    >
      {m.label}
    </button>
  )
}
