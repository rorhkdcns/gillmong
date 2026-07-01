'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAdminDreamDetail } from '../../actions'

type Buyer = {
  id: number; price: number; buyer_id: string; created_at: string
  profile: { nickname: string; username: string } | null
}
type Report = {
  id: number; reason: string; detail: string | null; status: string; created_at: string
  reporter: { nickname: string; username: string } | null
}
type Dream = {
  id: number; title: string; grade: string; category: string; price: number
  is_sold: boolean; created_at: string; user_id: string; content: string
  summary: string; interpretation: string; advice: string; reconstructed_dream: string
  seller: { nickname: string; username: string } | null
  buyers: Buyer[]
  reports: Report[]
}

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-400', D: 'bg-orange-400', E: 'bg-red-400',
}
const REPORT_STATUS: Record<string, string> = {
  pending: '검토중', dismissed: '반려됨', resolved: '처리완료',
}
const REPORT_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', dismissed: 'bg-gray-100 text-gray-500', resolved: 'bg-emerald-100 text-emerald-700',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminDreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [dream, setDream]   = useState<Dream | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [working, setWorking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await getAdminDreamDetail(Number(id))
      if (res.error) { setError(res.error); setLoading(false); return }
      setDream(res.data as Dream)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDeleteWithRefund() {
    setWorking(true)
    setActionMsg(null)
    const res = await fetch('/api/admin/process-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreamId: Number(id) }),
    })
    const json = await res.json()
    setWorking(false)
    setConfirmDelete(false)
    if (!res.ok) {
      setActionMsg({ ok: false, text: json.error ?? '삭제 실패' })
    } else {
      setActionMsg({ ok: true, text: `삭제 완료. 구매자 ${json.refunded}명 환불됨.` })
      setTimeout(() => router.push('/admin/dreams'), 1500)
    }
  }

  if (loading) return <div className="p-8 text-sm text-[#999]">불러오는 중...</div>
  if (error)   return <div className="p-8 text-sm text-red-500">{error}</div>
  if (!dream)  return null

  const pendingReports = dream.reports.filter((r) => r.status === 'pending')

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">

      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/dreams" className="text-sm text-[#999] hover:text-[#01273A]">← 꿈 관리</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-[#01273A]">상세</span>
      </div>

      {/* 결과 토스트 */}
      {actionMsg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${actionMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* 신고 경고 배너 */}
      {pendingReports.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-semibold text-red-700">검토중인 신고 {pendingReports.length}건 있음</p>
        </div>
      )}

      {/* 꿈 기본 정보 */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-black text-white ${GRADE_COLOR[dream.grade] ?? 'bg-gray-400'}`}>
            {dream.grade}
          </span>
          <h1 className="text-lg font-bold text-[#01273A]">{dream.title}</h1>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${dream.is_sold ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
            {dream.is_sold ? '판매완료' : '판매중'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-[#999]">감정가</p><p className="font-semibold text-[#E07B2A]">{dream.price.toLocaleString()}원</p></div>
          <div><p className="text-xs text-[#999]">등록자</p><p className="font-semibold text-[#333]">{dream.seller?.nickname ?? '-'}</p></div>
          <div><p className="text-xs text-[#999]">등록일</p><p className="text-[#555]">{formatDate(dream.created_at)}</p></div>
          <div><p className="text-xs text-[#999]">꿈 ID</p><p className="font-mono text-[#777]">#{dream.id}</p></div>
        </div>
      </div>

      {/* 원본 내용 */}
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
        <div className="border-b border-amber-200 px-6 py-3">
          <h2 className="text-sm font-bold text-amber-800">원본 내용 (사용자 입력)</h2>
        </div>
        <div className="px-6 py-5">
          {dream.content ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#333]">{dream.content}</p>
          ) : (
            <p className="text-sm text-[#999]">원본 내용 없음</p>
          )}
        </div>
      </div>

      {/* AI 해석 */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-3">
          <h2 className="text-sm font-bold text-[#01273A]">AI 해석 (전체 열람)</h2>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm">
          {dream.reconstructed_dream && (
            <div>
              <p className="mb-1 text-xs font-semibold text-[#999]">재구성된 꿈</p>
              <p className="leading-relaxed text-[#333] whitespace-pre-line">{dream.reconstructed_dream}</p>
            </div>
          )}
          {dream.summary && (
            <div>
              <p className="mb-1 text-xs font-semibold text-[#999]">요약</p>
              <p className="leading-relaxed text-[#555] whitespace-pre-line">{dream.summary}</p>
            </div>
          )}
          {dream.interpretation && (
            <div>
              <p className="mb-1 text-xs font-semibold text-[#999]">해석</p>
              <p className="leading-relaxed text-[#555] whitespace-pre-line">{dream.interpretation}</p>
            </div>
          )}
          {dream.advice && (
            <div>
              <p className="mb-1 text-xs font-semibold text-[#999]">조언</p>
              <p className="leading-relaxed text-[#555] whitespace-pre-line">{dream.advice}</p>
            </div>
          )}
        </div>
      </div>

      {/* 구매자 목록 */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#01273A]">구매자 목록</h2>
          <span className="text-xs text-[#999]">{dream.buyers.length}명</span>
        </div>
        {dream.buyers.length === 0 ? (
          <p className="px-6 py-4 text-sm text-[#999]">구매자 없음</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-[#999]">
                <th className="px-6 py-2 text-left">닉네임</th>
                <th className="px-6 py-2 text-left">구매일</th>
                <th className="px-6 py-2 text-right">결제금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dream.buyers.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-[#333]">{b.profile?.nickname ?? b.buyer_id.slice(0,8)}</td>
                  <td className="px-6 py-3 text-[#999]">{formatDate(b.created_at)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-[#E07B2A]">{b.price.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 신고 목록 */}
      {dream.reports.length > 0 && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#01273A]">신고 내역</h2>
            <span className="text-xs text-[#999]">{dream.reports.length}건</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-[#999]">
                <th className="px-6 py-2 text-left">신고자</th>
                <th className="px-6 py-2 text-left">이유</th>
                <th className="px-6 py-2 text-left">상세</th>
                <th className="px-6 py-2 text-left">일시</th>
                <th className="px-6 py-2 text-left">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dream.reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-[#555]">{r.reporter?.nickname ?? '-'}</td>
                  <td className="px-6 py-3 text-[#333]">{r.reason}</td>
                  <td className="max-w-[160px] truncate px-6 py-3 text-[#777]">{r.detail ?? '-'}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-[#999]">{formatDate(r.created_at)}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_COLOR[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {REPORT_STATUS[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 삭제 + 환불 버튼 */}
      <div className="flex justify-end gap-3">
        <Link href="/admin/dreams" className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#555] hover:bg-gray-50">
          목록으로
        </Link>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
          disabled={working}
        >
          꿈 삭제 + 구매자 환불
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-[#01273A]">꿈 삭제 확인</h3>
            <p className="mb-1 text-center text-sm text-[#555]">&ldquo;{dream.title}&rdquo;</p>
            <p className="mb-6 text-center text-xs text-[#999]">
              구매자 {dream.buyers.length}명에게 포인트가 환불되며,<br />관련 신고는 처리완료로 변경됩니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} disabled={working}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-50">
                취소
              </button>
              <button onClick={handleDeleteWithRefund} disabled={working}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                {working ? '처리 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
