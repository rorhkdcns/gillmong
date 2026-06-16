'use client'

import { useEffect, useState } from 'react'
import { getAdminUsers, adminAdjustPoints, adminSendPasswordReset, adminDeleteUser } from '../actions'

type User = { id: string; nickname: string; username: string; real_name: string; phone: string; email: string; points: number; created_at: string }

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminUsers() {
  const [users, setUsers]       = useState<User[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  const [modal, setModal] = useState<{ user: User; type: 'points' | 'reset' | 'delete' } | null>(null)
  const [amount, setAmount]   = useState('')
  const [desc, setDesc]       = useState('')
  const [working, setWorking] = useState(false)
  const [msg, setMsg]         = useState('')
  const [resetLink, setResetLink] = useState('')

  async function load(q?: string) {
    setLoading(true)
    setUsers(await getAdminUsers(q))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openModal(user: User, type: 'points' | 'reset' | 'delete') {
    setModal({ user, type })
    setAmount(''); setDesc(''); setMsg(''); setResetLink('')
  }
  function closeModal() { setModal(null); setMsg(''); setResetLink('') }

  async function handlePoints() {
    if (!modal) return
    const n = parseInt(amount, 10)
    if (isNaN(n) || n === 0) { setMsg('금액을 입력해주세요.'); return }
    setWorking(true)
    const res = await adminAdjustPoints(modal.user.id, n, desc)
    setWorking(false)
    if (res.error) { setMsg(res.error); return }
    setMsg('완료됐습니다.')
    load(search || undefined)
  }

  async function handleReset() {
    if (!modal) return
    setWorking(true)
    const res = await adminSendPasswordReset(modal.user.id)
    setWorking(false)
    if (res.error) { setMsg(res.error); return }
    setResetLink(res.link ?? '')
    setMsg('비밀번호 재설정 링크가 생성됐습니다.')
  }

  async function handleDelete() {
    if (!modal) return
    setWorking(true)
    const res = await adminDeleteUser(modal.user.id)
    setWorking(false)
    if (res.error) { setMsg(res.error); return }
    closeModal()
    load(search || undefined)
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-[#01273A]">회원 관리</h1>

      {/* 검색 */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search || undefined)}
          placeholder="닉네임 또는 아이디 검색"
          className="w-64 border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]"
        />
        <button
          onClick={() => load(search || undefined)}
          className="bg-[#01273A] px-4 py-2 text-sm font-semibold text-white hover:brightness-90"
        >
          검색
        </button>
        {search && (
          <button onClick={() => { setSearch(''); load() }} className="px-4 py-2 text-sm text-[#777] hover:text-[#333]">
            초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
              <th className="px-4 py-3">닉네임</th>
              <th className="px-4 py-3">아이디</th>
              <th className="px-4 py-3">실명</th>
              <th className="px-4 py-3">전화번호</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">포인트</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-[#999]">불러오는 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-[#999]">회원이 없습니다</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#333]">{u.nickname}</td>
                <td className="px-4 py-3 text-[#777]">@{u.username}</td>
                <td className="px-4 py-3 text-[#333]">{u.real_name || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-[#555]">{u.phone || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-[#555]">{u.email || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-[#E07B2A]">{u.points.toLocaleString()} P</td>
                <td className="px-4 py-3 text-[#999]">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openModal(u, 'points')} className="rounded bg-[#01273A] px-3 py-1 text-xs text-white hover:brightness-90">포인트</button>
                    <button onClick={() => openModal(u, 'reset')}  className="rounded border border-gray-300 px-3 py-1 text-xs text-[#555] hover:border-[#01273A]">비번 초기화</button>
                    <button onClick={() => openModal(u, 'delete')} className="rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:border-red-400">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="w-full max-w-sm bg-white p-8 shadow-xl">

            {modal.type === 'points' && (
              <>
                <h2 className="mb-1 text-lg font-bold text-[#01273A]">포인트 지급/차감</h2>
                <p className="mb-5 text-sm text-[#777]">{modal.user.nickname} (@{modal.user.username})<br />현재: {modal.user.points.toLocaleString()} P</p>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="양수=지급, 음수=차감 (예: -5000)"
                  className="mb-3 w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="사유 (선택)"
                  className="mb-5 w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
                {msg && <p className="mb-3 text-sm text-emerald-600">{msg}</p>}
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 border border-gray-300 py-2 text-sm text-[#555] hover:border-[#01273A]">취소</button>
                  <button onClick={handlePoints} disabled={working} className="flex-1 bg-[#01273A] py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">{working ? '처리 중...' : '적용'}</button>
                </div>
              </>
            )}

            {modal.type === 'reset' && (
              <>
                <h2 className="mb-1 text-lg font-bold text-[#01273A]">비밀번호 초기화</h2>
                <p className="mb-5 text-sm text-[#777]">{modal.user.nickname}님의 비밀번호 재설정 링크를 생성합니다.</p>
                {msg && <p className="mb-3 text-sm text-emerald-600">{msg}</p>}
                {resetLink && (
                  <div className="mb-4 break-all rounded bg-gray-50 p-3 text-xs text-[#555]">{resetLink}</div>
                )}
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 border border-gray-300 py-2 text-sm text-[#555] hover:border-[#01273A]">닫기</button>
                  {!resetLink && <button onClick={handleReset} disabled={working} className="flex-1 bg-[#01273A] py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">{working ? '생성 중...' : '링크 생성'}</button>}
                </div>
              </>
            )}

            {modal.type === 'delete' && (
              <>
                <h2 className="mb-1 text-lg font-bold text-red-600">회원 삭제</h2>
                <p className="mb-5 text-sm text-[#777]"><span className="font-semibold">{modal.user.nickname}</span>님을 삭제합니다.<br />관련 꿈, 구매 내역, 포인트 로그가 모두 삭제됩니다.</p>
                {msg && <p className="mb-3 text-sm text-red-500">{msg}</p>}
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 border border-gray-300 py-2 text-sm text-[#555]">취소</button>
                  <button onClick={handleDelete} disabled={working} className="flex-1 bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">{working ? '삭제 중...' : '삭제'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
