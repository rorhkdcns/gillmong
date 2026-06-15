'use client'

import { useEffect, useState } from 'react'
import { getAdminDreams, adminDeleteDreamById } from '../actions'

type Dream = {
  id: number; title: string; grade: string; category: string
  price: number; is_sold: boolean; created_at: string
  profiles: { nickname: string; username: string } | null
}

const CATEGORY_LABEL: Record<string, string> = {
  people: '인물·신체', animals: '동물·식물', nature: '자연·사물', action: '행동·상황', etc: '기타',
}

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-400', D: 'bg-orange-400', E: 'bg-red-400', F: 'bg-gray-400',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminDreams() {
  const [dreams, setDreams]     = useState<Dream[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState('')
  const [isSold, setIsSold]     = useState('')
  const [confirm, setConfirm]   = useState<Dream | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg]           = useState('')

  async function load() {
    setLoading(true)
    const data = await getAdminDreams(category || undefined, isSold || undefined)
    setDreams(data as unknown as Dream[])
    setLoading(false)
  }

  useEffect(() => { load() }, [category, isSold])

  async function handleDelete() {
    if (!confirm) return
    setDeleting(true)
    const res = await adminDeleteDreamById(confirm.id)
    setDeleting(false)
    if (res.error) { setMsg(res.error); return }
    setConfirm(null)
    load()
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-[#01273A]">꿈 관리</h1>

      {/* 필터 */}
      <div className="mb-6 flex gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]">
          <option value="">전체 카테고리</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={isSold} onChange={(e) => setIsSold(e.target.value)}
          className="border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]">
          <option value="">판매여부 전체</option>
          <option value="false">판매 중</option>
          <option value="true">판매 완료</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
              <th className="px-6 py-3">등급</th>
              <th className="px-6 py-3">제목</th>
              <th className="px-6 py-3">카테고리</th>
              <th className="px-6 py-3">감정가</th>
              <th className="px-6 py-3">판매여부</th>
              <th className="px-6 py-3">등록자</th>
              <th className="px-6 py-3">등록일</th>
              <th className="px-6 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-[#999]">불러오는 중...</td></tr>
            ) : dreams.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-[#999]">꿈이 없습니다</td></tr>
            ) : dreams.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[d.grade] ?? 'bg-gray-400'}`}>{d.grade}</span>
                </td>
                <td className="max-w-[200px] truncate px-6 py-3 text-[#333]">
                  <a href={`/dream/${d.id}`} target="_blank" rel="noreferrer" className="hover:underline">{d.title}</a>
                </td>
                <td className="px-6 py-3 text-[#777]">{CATEGORY_LABEL[d.category] ?? d.category}</td>
                <td className="px-6 py-3 text-[#E07B2A]">{d.price.toLocaleString()} P</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.is_sold ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
                    {d.is_sold ? '판매완료' : '판매중'}
                  </span>
                </td>
                <td className="px-6 py-3 text-[#777]">{d.profiles?.nickname ?? '-'}</td>
                <td className="px-6 py-3 text-[#999]">{formatDate(d.created_at)}</td>
                <td className="px-6 py-3">
                  <button onClick={() => { setConfirm(d); setMsg('') }} className="rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:border-red-400">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 삭제 확인 모달 */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null) }}>
          <div className="w-full max-w-sm bg-white p-8 shadow-xl">
            <h2 className="mb-3 text-lg font-bold text-red-600">꿈 삭제</h2>
            <p className="mb-5 text-sm text-[#777]">
              <span className="font-semibold text-[#333]">"{confirm.title}"</span>을(를) 삭제합니다.<br />
              관련 구매 내역도 함께 삭제됩니다.
            </p>
            {msg && <p className="mb-3 text-sm text-red-500">{msg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 border border-gray-300 py-2 text-sm text-[#555]">취소</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">{deleting ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
