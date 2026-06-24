'use client'

import { useEffect, useState } from 'react'
import { getBusinessApplications, adminHandleBusinessApproval } from '../actions'

type BusinessUser = {
  id: string
  username: string
  nickname: string
  real_name: string
  phone: string
  email: string
  business_name: string | null
  business_number: string | null
  representative_name: string | null
  verification_status: 'pending' | 'approved' | 'rejected' | null
  verified_at: string | null
  created_at: string
}

const STATUS_TABS = [
  { key: 'pending',  label: '대기중',  cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'approved', label: '승인됨',  cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'rejected', label: '거절됨',  cls: 'text-red-500 bg-red-50 border-red-200' },
  { key: 'all',      label: '전체',    cls: 'text-[#555] bg-gray-50 border-gray-200' },
]

function statusBadge(status: string | null) {
  if (status === 'pending')  return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">대기중</span>
  if (status === 'approved') return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">승인됨</span>
  if (status === 'rejected') return <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500">거절됨</span>
  return <span className="text-xs text-gray-400">-</span>
}

function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function fmtBizNo(n: string | null) {
  if (!n) return '-'
  const d = n.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`
  return n
}

export default function AdminBusinessPage() {
  const [tab,     setTab]     = useState<string>('pending')
  const [users,   setUsers]   = useState<BusinessUser[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [msg,     setMsg]     = useState<{ id: string; text: string; ok: boolean } | null>(null)

  async function load(status: string) {
    setLoading(true)
    const res = await getBusinessApplications(status === 'all' ? undefined : status)
    setUsers((res.data ?? []) as BusinessUser[])
    setLoading(false)
  }

  useEffect(() => { load(tab) }, [tab])

  async function handleAction(userId: string, action: 'approve' | 'reject') {
    setWorking(userId)
    setMsg(null)
    const res = await adminHandleBusinessApproval(userId, action)
    setWorking(null)
    if (res.error) {
      setMsg({ id: userId, text: res.error, ok: false })
    } else {
      setMsg({ id: userId, text: action === 'approve' ? '승인되었습니다.' : '거절되었습니다.', ok: true })
      await load(tab)
    }
  }

  const pendingCount = tab === 'all'
    ? users.filter(u => u.verification_status === 'pending').length
    : tab === 'pending' ? users.length : 0

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-bold text-[#01273A] sm:text-2xl">사업자회원 승인</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
            {pendingCount}
          </span>
        )}
      </div>

      {/* 탭 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg(null) }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t.key ? t.cls : 'border-gray-200 bg-white text-[#777] hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
              <th className="px-4 py-3">회원정보</th>
              <th className="px-4 py-3">상호명</th>
              <th className="px-4 py-3">사업자번호</th>
              <th className="px-4 py-3">대표자</th>
              <th className="px-4 py-3">신청일</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[#999]">불러오는 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[#999]">해당 항목이 없습니다</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#333]">{u.nickname}</p>
                  <p className="text-xs text-[#999]">@{u.username}</p>
                </td>
                <td className="px-4 py-3 font-medium text-[#333]">{u.business_name || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 font-mono text-[#555]">{fmtBizNo(u.business_number)}</td>
                <td className="px-4 py-3 text-[#555]">{u.representative_name || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-[#999]">{fmt(u.created_at)}</td>
                <td className="px-4 py-3">{statusBadge(u.verification_status)}</td>
                <td className="px-4 py-3">
                  {msg?.id === u.id ? (
                    <p className={`text-xs font-medium ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</p>
                  ) : u.verification_status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(u.id, 'approve')}
                        disabled={working === u.id}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {working === u.id ? '처리중...' : '승인'}
                      </button>
                      <button
                        onClick={() => handleAction(u.id, 'reject')}
                        disabled={working === u.id}
                        className="rounded border border-red-300 px-3 py-1 text-xs text-red-500 hover:border-red-500 disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  ) : (
                    u.verification_status === 'approved' ? (
                      <button
                        onClick={() => handleAction(u.id, 'reject')}
                        disabled={working === u.id}
                        className="rounded border border-gray-300 px-3 py-1 text-xs text-[#777] hover:border-red-300 hover:text-red-500 disabled:opacity-50"
                      >
                        승인 취소
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(u.id, 'approve')}
                        disabled={working === u.id}
                        className="rounded border border-gray-300 px-3 py-1 text-xs text-[#777] hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                      >
                        재승인
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 안내 */}
      <p className="mt-4 text-xs text-[#999]">
        승인 시 사업자회원으로 전환되어 판매 한도 제한이 해제됩니다. 거절 시 일반회원 한도가 적용됩니다.
      </p>
    </div>
  )
}
