'use client'

import { useActionState, useState } from 'react'
import { withdrawalAction } from '@/app/actions'
import Link from 'next/link'

const BANKS = [
  'KB국민은행', '신한은행', '우리은행', '하나은행', 'IBK기업은행',
  'NH농협은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고',
  '신협', '우체국', 'SC제일은행', '씨티은행', '대구은행',
  '부산은행', '광주은행', '전북은행', '경남은행', '제주은행',
]

export default function WithdrawalForm({
  balance,
  realName,
}: {
  balance: number
  realName: string
}) {
  const [state, formAction, isPending] = useActionState(withdrawalAction, null)
  const [amount, setAmount] = useState('')

  const parsed = parseInt(amount.replace(/,/g, ''), 10)
  const isValidAmount = parsed >= 5000 && parsed % 1000 === 0 && parsed <= balance

  if (state?.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="mb-1 text-lg font-bold text-emerald-700">출금 신청 완료</p>
        <p className="mb-4 text-sm text-emerald-600">
          영업일 기준 3~5일 내 입금됩니다.
        </p>
        <Link
          href="/mypage"
          className="inline-block bg-[#01273A] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-90"
        >
          마이페이지로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* 출금 금액 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#555555]">
          출금 금액 <span className="text-[#E07B2A]">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="amount"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              setAmount(raw ? parseInt(raw, 10).toLocaleString() : '')
            }}
            placeholder="5,000 이상, 1,000 단위"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 pr-8 text-base text-[#333333] outline-none focus:border-[#01273A]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#777777]">P</span>
        </div>
        <p className="mt-1 text-xs text-[#999]">
          보유 포인트:{' '}
          <span className="font-semibold text-[#E07B2A]">{balance.toLocaleString()}P</span>
          {' '}· 최소 5,000P · 1,000P 단위
        </p>
      </div>

      {/* 빠른 금액 선택 */}
      <div className="flex flex-wrap gap-2">
        {[5000, 10000, 30000, 50000].map((v) => (
          <button
            key={v}
            type="button"
            disabled={balance < v}
            onClick={() => setAmount(v.toLocaleString())}
            className={`rounded border px-3 py-1.5 text-sm transition ${
              parsed === v
                ? 'border-[#01273A] bg-[#01273A] text-white'
                : 'border-gray-300 text-[#555555] hover:border-[#01273A] hover:text-[#01273A]'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {v.toLocaleString()}P
          </button>
        ))}
        <button
          type="button"
          disabled={balance < 1000}
          onClick={() => setAmount(Math.floor(balance / 1000) * 1000 > 0 ? (Math.floor(balance / 1000) * 1000).toLocaleString() : '')}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-[#555555] transition hover:border-[#01273A] hover:text-[#01273A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          전액
        </button>
      </div>

      {/* 은행명 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#555555]">
          은행명 <span className="text-[#E07B2A]">*</span>
        </label>
        <select
          name="bank_name"
          required
          defaultValue=""
          className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] outline-none focus:border-[#01273A]"
        >
          <option value="" disabled>은행 선택</option>
          {BANKS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* 계좌번호 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#555555]">
          계좌번호 <span className="text-[#E07B2A]">*</span>
        </label>
        <input
          type="text"
          name="account_number"
          placeholder="숫자만 입력 (예: 1234567890)"
          required
          inputMode="numeric"
          className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
        />
      </div>

      {/* 예금주 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#555555]">
          예금주 <span className="text-[#E07B2A]">*</span>
        </label>
        <input
          type="text"
          name="account_holder"
          defaultValue={realName}
          placeholder="예금주 이름"
          required
          className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
        />
      </div>

      {/* 에러 */}
      {state?.error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* 안내 */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-[#777777]">
        <ul className="space-y-1.5">
          <li>• 신청 후 영업일 기준 3~5일 내 입금됩니다.</li>
          <li>• 포인트는 신청 즉시 차감됩니다.</li>
          <li>• 계좌 정보 오입력 시 발생하는 손실은 책임지지 않습니다.</li>
          <li>• 최소 출금 금액은 5,000P입니다.</li>
        </ul>
      </div>

      {/* 제출 */}
      <button
        type="submit"
        disabled={isPending || !isValidAmount}
        className={`w-full py-3.5 text-base font-bold text-white transition ${
          isPending || !isValidAmount
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-[#01273A] hover:brightness-90'
        }`}
      >
        {isPending ? '신청 중...' : `${parsed > 0 ? parsed.toLocaleString() + 'P ' : ''}출금 신청하기`}
      </button>
    </form>
  )
}
