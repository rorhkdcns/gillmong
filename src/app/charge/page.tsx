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
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  const handleCharge = async () => {
    if (!selectedAmount) {
      setError('충전 금액을 선택해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('0️⃣ userId 가져오기 시작...')

      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().auth.getUser()
      const userId = data?.user?.id

      console.log('0️⃣-1 userId:', userId)

      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.')
      }

      console.log('1️⃣ API 호출 시작...')

      const response = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: selectedAmount }),
      })

      console.log('2️⃣ API 응답 받음:', response.ok)

      if (!response.ok) throw new Error('결제 준비 실패')

      const paymentData = await response.json()
      console.log('3️⃣ 결제 데이터:', paymentData)
      console.log('4️⃣ window.nicepay 있는지?', !!window.nicepay)

      if (window.nicepay) {
        console.log('5️⃣ 결제창 호출 시도...')
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
        console.log('6️⃣ 결제창 호출 완료')
      } else {
        console.log('❌ window.nicepay 없음!')
        alert('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.')
      }
    } catch (err) {
      console.error('❌ 에러:', err)
      setError(err instanceof Error ? err.message : '오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <div className="flex-1 mx-auto w-full max-w-2xl p-6">
        <h1 className="mb-8 text-3xl font-bold">포인트 충전</h1>

        {error && (
          <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">충전 금액 선택</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {CHARGE_AMOUNTS.map((item) => (
              <button
                key={item.points}
                onClick={() => setSelectedAmount(item.price)}
                disabled={loading}
                className={`rounded-lg border-2 p-4 text-center transition disabled:opacity-50 ${
                  selectedAmount === item.price
                    ? 'border-[#E07B2A] bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="mb-1 text-xl font-bold text-[#E07B2A]">
                  +{item.points.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  ₩{item.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedAmount && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-gray-600">
              충전할 금액:
              <span className="ml-2 text-lg font-bold text-[#E07B2A]">
                ₩{selectedAmount.toLocaleString()}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={handleCharge}
          disabled={loading || !selectedAmount}
          className={`mb-6 w-full rounded-lg py-4 text-lg font-bold text-white transition ${
            loading || !selectedAmount
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-[#E07B2A] hover:brightness-90'
          }`}
        >
          {loading ? '결제 진행 중...' : '포인트 충전하기'}
        </button>

        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold">포인트 충전 안내</h3>
          <ul className="space-y-2 text-sm text-gray-700">
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
