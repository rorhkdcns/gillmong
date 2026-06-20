'use client'

import { useState, useTransition } from 'react'
import { deleteMyAccountAction } from '@/app/actions'

export default function WithdrawConfirm() {
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const result = await deleteMyAccountAction()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/mypage"
          className="flex-1 rounded-xl border border-gray-300 py-3.5 text-center text-sm font-semibold text-[#555555] transition hover:bg-gray-50"
        >
          취소
        </a>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex-1 rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white transition hover:bg-red-600"
        >
          탈퇴하기
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-[#01273A]">마지막 확인</h3>
            <p className="mb-6 text-center text-sm text-[#777777]">
              탈퇴하면 모든 데이터가 즉시 삭제됩니다.<br />
              이 작업은 되돌릴 수 없습니다.
            </p>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-[#555555] transition hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? '탈퇴 처리 중...' : '탈퇴 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
