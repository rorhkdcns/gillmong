'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function handleAddAmount(item: { points: number; price: number }) {
    setTotalAmount(prev => prev + item.price)
    setTotalPoints(prev => prev + item.points)
  }

  function handleClear() {
    setTotalAmount(0)
    setTotalPoints(0)
  }

  const handleCharge = async () => {
    if (totalAmount === 0) {
      setError('충전 금액을 선택해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().auth.getSession()
      const userId = data?.session?.user?.id

      if (!userId) throw new Error('사용자 ID를 찾을 수 없습니다')

      const response = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: totalAmount }),
      })

      if (!response.ok) throw new Error('결제 준비 실패')

      const paymentData = await response.json()

      if (window.nicepay) {
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
      } else {
        alert('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 p-6">
        <h1 className="mb-8 text-3xl font-bold">포인트 충전</h1>

        {error && (
          <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* 충전 금액 선택 */}
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold">충전 금액 선택</h2>
          <p className="mb-4 text-sm text-gray-500">버튼을 클릭하면 금액이 누적됩니다</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {CHARGE_AMOUNTS.map((item) => (
              <button
                key={item.points}
                onClick={() => handleAddAmount(item)}
                disabled={loading}
                className="rounded-lg border-2 border-gray-300 p-4 text-center transition hover:border-[#E07B2A] hover:bg-orange-50 disabled:opacity-50"
              >
                <div className="mb-1 text-xl font-bold text-[#E07B2A]">
                  +{item.points.toLocaleString()} P
                </div>
                <div className="text-sm text-gray-600">
                  ₩{item.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 총 충전액 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-[#01273A]">총 충전액</span>
            {totalAmount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-400 underline hover:text-red-400"
              >
                초기화
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#01273A]">
              ₩{totalAmount.toLocaleString()}
            </span>
            <span className="text-xl font-bold text-[#E07B2A]">
              {totalPoints.toLocaleString()} P
            </span>
          </div>
        </div>

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
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold">포인트 충전 안내</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 같은 금액을 여러 번 클릭하면 금액이 누적됩니다</li>
            <li>• 충전된 포인트는 꿈 구매에 즉시 사용할 수 있습니다</li>
            <li>• 환불은 불가능하니 신중하게 선택해주세요</li>
            <li>• 포인트는 마이페이지에서 실시간으로 확인할 수 있습니다</li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/mypage" className="text-[#E07B2A] hover:underline">
            마이페이지로 돌아가기
          </Link>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
