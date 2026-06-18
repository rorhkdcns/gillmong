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
  const [selectedItems, setSelectedItems] = useState<Array<{ points: number; price: number }>>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0)
  const totalPoints = selectedItems.reduce((sum, item) => sum + item.points, 0)

  const handleAddAmount  = (item: { points: number; price: number }) => setSelectedItems([...selectedItems, item])
  const handleRemoveItem = (index: number) => setSelectedItems(selectedItems.filter((_, i) => i !== index))
  const handleClear      = () => setSelectedItems([])

  const handleCharge = async () => {
    if (totalAmount === 0) {
      setError('충전 금액을 선택해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('userId 가져오기 시작...')
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().auth.getSession()
      const userId = data?.session?.user?.id

      console.log('userId:', userId)

      if (!userId) throw new Error('사용자 ID를 찾을 수 없습니다')

      console.log('API 호출 시작...')
      const response = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: totalAmount }),
      })

      console.log('API 응답:', response.ok)

      if (!response.ok) throw new Error('결제 준비 실패')

      const paymentData = await response.json()
      console.log('결제 데이터:', paymentData)
      console.log('window.nicepay 있는지?', !!window.nicepay)

      if (window.nicepay) {
        console.log('결제창 호출...')
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
      console.error('에러:', err)
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

        {/* 충전 금액 선택 */}
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold">충전 금액 선택</h2>
          <p className="mb-4 text-sm text-gray-500">원하는 금액을 클릭하면 장바구니에 추가됩니다</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {CHARGE_AMOUNTS.map((item) => (
              <button
                key={item.points}
                onClick={() => handleAddAmount(item)}
                disabled={loading}
                className="rounded-lg border-2 border-gray-300 p-4 text-center transition hover:border-[#E07B2A] hover:bg-orange-50 disabled:opacity-50"
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

        {/* 선택된 항목 */}
        {selectedItems.length > 0 && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">선택된 항목</h3>
              <button onClick={handleClear} className="text-sm text-gray-500 underline hover:text-red-500">
                초기화
              </button>
            </div>
            <div className="mb-4 space-y-2">
              {selectedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded bg-white p-3">
                  <span className="text-gray-700">
                    +{item.points.toLocaleString()} 포인트 (₩{item.price.toLocaleString()})
                  </span>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="font-bold text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
              <span>총 충전액:</span>
              <span className="text-[#E07B2A]">
                ₩{totalAmount.toLocaleString()} ({totalPoints.toLocaleString()} 포인트)
              </span>
            </div>
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
          {loading ? '결제 진행 중...' : `₩${totalAmount.toLocaleString()} 포인트 충전하기`}
        </button>

        {/* 안내 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold">포인트 충전 안내</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 같은 금액을 여러 번 클릭하면 누적됩니다</li>
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
