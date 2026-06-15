'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { syncSalePoints, resetAllData } from '../actions'

export default function AdminPointsPage() {
  const [username, setUsername] = useState('')
  const [amount, setAmount]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [syncing, setSyncing]       = useState(false)
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [resetting, setResetting]     = useState(false)
  const [resetResult, setResetResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    const amt = parseInt(amount, 10)
    if (!username.trim()) { setResult({ type: 'error', message: '아이디를 입력해주세요.' }); return }
    if (!amt || amt <= 0) { setResult({ type: 'error', message: '포인트 금액을 올바르게 입력해주세요.' }); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_give_points', { target_username: username.trim(), amount_to_add: amt })
    setLoading(false)
    if (error) { setResult({ type: 'error', message: error.message }); return }
    if (!data) { setResult({ type: 'error', message: 'SQL 패치(patch_02)가 Supabase에 적용됐는지 확인해주세요.' }); return }
    const res = data as { error?: string; success?: boolean; new_points?: number }
    if (res.error) {
      setResult({ type: 'error', message: res.error })
    } else {
      setResult({ type: 'success', message: `@${username.trim()}에게 ${amt.toLocaleString()} P 지급 완료 (잔액: ${res.new_points?.toLocaleString()} P)` })
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
    if (!window.confirm('꿈 내역과 포인트를 전부 초기화합니다. 되돌릴 수 없습니다. 계속하시겠습니까?')) return
    setResetting(true); setResetResult(null)
    const res = await resetAllData()
    setResetting(false)
    if (res.error) setResetResult({ type: 'error', message: res.error })
    else setResetResult({ type: 'success', message: '초기화 완료 — 꿈·구매·포인트 내역이 모두 삭제됐습니다.' })
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-[#01273A]">포인트 지급</h1>

      <div className="max-w-md space-y-6">
        {/* 포인트 지급 */}
        <div className="rounded border border-gray-200 bg-white p-8">
          <h2 className="mb-5 font-bold text-[#01273A]">아이디로 직접 지급</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">아이디</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="수신자 아이디 입력"
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">포인트 금액</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 10000" min={1}
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
            </div>
            {result && (
              <div className={`rounded px-4 py-3 text-sm ${result.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {result.message}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-[#01273A] py-3 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
              {loading ? '처리 중...' : '포인트 지급하기'}
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
          <button onClick={handleSync} disabled={syncing}
            className="w-full bg-[#6B96A8] py-3 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
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
          <button onClick={handleReset} disabled={resetting}
            className="w-full bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
            {resetting ? '초기화 중...' : '전체 초기화 실행'}
          </button>
        </div>
      </div>
    </div>
  )
}
