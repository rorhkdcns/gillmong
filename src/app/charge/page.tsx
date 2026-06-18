'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const CHARGE_AMOUNTS = [
  { points: 1000,   price: 1000 },
  { points: 5000,   price: 5000 },
  { points: 10000,  price: 10000 },
  { points: 50000,  price: 50000 },
  { points: 100000, price: 100000 },
]

declare global {
  interface Window {
    nicepay?: {
      requestPayment: (config: Record<string, unknown>) => void
    }
  }
}

export default function ChargePage() {
  const router = useRouter()
  const [userId, setUserId]               = useState<string | null>(null)
  const [ready, setReady]                 = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login')
        return
      }
      setUserId(user.id)
      setReady(true)
    })
  }, [router])

  if (!ready) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-400">로딩 중...</p>
        </div>
        <SiteFooter />
      </>
    )
  }

  async function handleCharge() {
    if (!selectedAmount) {
      setError('충전 금액을 선택해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: selectedAmount }),
      })

      if (!response.ok) throw new Error('결제 준비 실패')

      const paymentData = await response.json()

      if (!window.nicepay) throw new Error('NicePay SDK 로드 실패')

      window.nicepay.requestPayment({
        clientId:    paymentData.clientId,
        method:      'card',
        orderId:     paymentData.orderId,
        amount:      paymentData.amount,
        productName: paymentData.productName,
        returnUrl:   paymentData.returnUrl,
        cancelUrl:   paymentData.cancelUrl,
        notifyUrl:   paymentData.notifyUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '포인트 충전 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-[#01273A]">포인트 충전</h1>
        <p className="mb-10 text-sm text-gray-400">충전 금액을 선택하고 결제를 진행해주세요</p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 금액 선택 */}
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-[#01273A]">충전 금액 선택</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CHARGE_AMOUNTS.map((item) => (
              <button
                key={item.points}
                onClick={() => setSelectedAmount(item.price)}
                disabled={loading}
                className={`rounded-xl border-2 p-4 text-center transition disabled:opacity-50 ${
                  selectedAmount === item.price
                    ? 'border-[#E07B2A] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="text-xl font-bold text-[#E07B2A]">
                  +{item.points.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  ₩{item.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 선택된 금액 */}
        {selectedAmount && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-gray-600">
            충전할 금액:{' '}
            <span className="text-lg font-bold text-blue-600">
              ₩{selectedAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* 충전 버튼 */}
        <button
          onClick={handleCharge}
          disabled={loading || !selectedAmount}
          className={`mb-8 w-full rounded-xl py-4 text-lg font-bold text-white transition ${
            loading || !selectedAmount
              ? 'cursor-not-allowed bg-gray-300'
              : 'bg-[#E07B2A] hover:brightness-95 active:brightness-90'
          }`}
        >
          {loading ? '결제 진행 중...' : '포인트 충전하기'}
        </button>

        {/* 안내 */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 px-5 py-5">
          <h3 className="mb-3 font-semibold text-[#01273A]">포인트 충전 안내</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 충전된 포인트는 꿈 구매에 즉시 사용할 수 있습니다</li>
            <li>• 환불은 불가능하니 신중하게 선택해주세요</li>
            <li>• 포인트는 마이페이지에서 실시간으로 확인할 수 있습니다</li>
            <li>• 결제 후 승인까지 최대 1분이 소요될 수 있습니다</li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/mypage" className="text-sm text-[#E07B2A] hover:underline">
            마이페이지로 돌아가기
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
