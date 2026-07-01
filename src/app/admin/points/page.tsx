'use client'

import { useState } from 'react'
import { adminAdjustPointsByUsername, syncSalePoints, resetAllData } from '../actions'

export default function AdminPointsPage() {
  const [username, setUsername] = useState('')
  const [amount, setAmount]     = useState('')
  const [mode, setMode]         = useState<'give' | 'deduct'>('give')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [syncing, setSyncing]       = useState(false)
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [resetting, setResetting]     = useState(false)
  const [resetResult, setResetResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    const amt = parseInt(amount, 10)
    if (!username.trim()) { setResult({ type: 'error', message: '아이디를 입력해주세요.' }); return }
    if (!amt || amt <= 0) { setResult({ type: 'error', message: '포인트 금액을 올바르게 입력해주세요.' }); return }

    setLoading(true)
    const finalAmount = mode === 'deduct' ? -amt : amt
    const res = await adminAdjustPointsByUsername(username.trim(), finalAmount)
    setLoading(false)

    if (res.error) {
      setResult({ type: 'error', message: res.error })
    } else {
      const action = mode === 'give' ? '지급' : '차감'
      setResult({
        type: 'success',
        message: `@${username.trim()}에게 ${amt.toLocaleString()}원 ${action} 완료 (잔액: ${res.new_points?.toLocaleString()}원)`,
      })
      setUsername(''); setAmount('')
    }
  }

  async function handleSync() {
    setSyncing(true); setSyncResult(null)
    const res = await syncSalePoints()
    setSyncing(false)
    if (res.error) setSyncResult({ type: 'error', message: res.error })
    else setSyncResult({ type: 'success', message: `동기화 완료 — 판매 포인트 지급 ${res.synced}건, is_sold 수정 ${res.soldFixed}건` })
  }

  async function handleReset() {
    setShowResetModal(false)
    setResetting(true); setResetResult(null)
    const res = await resetAllData()
    setResetting(false)
    if (res.error) setResetResult({ type: 'error', message: res.error })
    else setResetResult({ type: 'success', message: '초기화 완료 — 꿈·구매·포인트 내역이 모두 삭제됐습니다.' })
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-[#01273A] sm:mb-8 sm:text-2xl">포인트 관리</h1>

      <div className="max-w-md space-y-6">
        {/* 포인트 지급 / 차감 */}
        <div className="rounded border border-gray-200 bg-white p-8">
          <h2 className="mb-5 font-bold text-[#01273A]">아이디로 직접 조정</h2>

          {/* 지급 / 차감 토글 */}
          <div className="mb-5 flex rounded border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode('give'); setResult(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                mode === 'give'
                  ? 'bg-[#01273A] text-white'
                  : 'bg-white text-[#555] hover:bg-gray-50'
              }`}
            >
              지급
            </button>
            <button
              type="button"
              onClick={() => { setMode('deduct'); setResult(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                mode === 'deduct'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-[#555] hover:bg-gray-50'
              }`}
            >
              차감
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="대상자 아이디 입력"
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">포인트 금액</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 10000"
                min={1}
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]"
              />
            </div>
            {result && (
              <div className={`rounded px-4 py-3 text-sm ${result.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {result.message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-60 ${
                mode === 'deduct' ? 'bg-red-500' : 'bg-[#01273A]'
              }`}
            >
              {loading ? '처리 중...' : mode === 'give' ? '포인트 지급하기' : '포인트 차감하기'}
            </button>
          </form>
        </div>

        {/* 판매 동기화 */}
        <div className="rounded border border-gray-200 bg-white p-8">
          <h2 className="mb-2 font-bold text-[#01273A]">판매 포인트 동기화</h2>
          <p className="mb-5 text-sm text-[#777]">purchases 기준으로 누락된 판매자 포인트를 일괄 지급하고 is_sold를 수정합니다.</p>
          {syncResult && (
            <div className={`mb-4 rounded px-4 py-3 text-sm ${syncResult.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {syncResult.message}
            </div>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-[#6B96A8] py-3 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
          >
            {syncing ? '동기화 중...' : '판매 포인트 동기화 실행'}
          </button>
        </div>

        {/* 전체 초기화 */}
        <div className="rounded border border-red-200 bg-white p-8">
          <h2 className="mb-2 font-bold text-red-600">전체 초기화</h2>
          <p className="mb-5 text-sm text-[#777]">꿈, 구매 내역, 포인트 로그 삭제 및 전 회원 포인트 0 초기화. <span className="font-semibold text-red-500">되돌릴 수 없습니다.</span></p>
          {resetResult && (
            <div className={`mb-4 rounded px-4 py-3 text-sm ${resetResult.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {resetResult.message}
            </div>
          )}
          <button
            onClick={() => setShowResetModal(true)}
            disabled={resetting}
            className="w-full bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {resetting ? '초기화 중...' : '전체 초기화 실행'}
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-red-600">전체 초기화</h3>
            <p className="mb-2 text-center text-sm text-[#555]">꿈 내역과 포인트를 전부 초기화합니다.</p>
            <p className="mb-6 text-center text-sm font-semibold text-red-500">되돌릴 수 없습니다. 계속하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-[#555] hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600"
              >
                초기화 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
