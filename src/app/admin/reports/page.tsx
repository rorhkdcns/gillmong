'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Report {
  id: number
  dream_id: number
  reporter_id: string
  reason: string
  detail: string | null
  status: string
  created_at: string
  dream_title?: string
  reporter_nickname?: string
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '검토중',
  dismissed: '반려됨',
  resolved:  '처리완료',
}
const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  dismissed: 'bg-gray-100 text-gray-500',
  resolved:  'bg-emerald-100 text-emerald-700',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ dreamId: number; reportId: number; dreamTitle: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function fetchReports() {
    const supabase = createClient()
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const dreamIds    = [...new Set(data.map((r: Report) => r.dream_id))]
    const reporterIds = [...new Set(data.map((r: Report) => r.reporter_id))]

    const [{ data: dreams }, { data: profiles }] = await Promise.all([
      dreamIds.length
        ? supabase.from('dreams').select('id, title').in('id', dreamIds)
        : Promise.resolve({ data: [] }),
      reporterIds.length
        ? supabase.from('profiles').select('id, nickname').in('id', reporterIds)
        : Promise.resolve({ data: [] }),
    ])

    const dreamMap: Record<number, string>  = {}
    const profMap:  Record<string, string>  = {}
    for (const d of dreams ?? [])   dreamMap[d.id] = d.title
    for (const p of profiles ?? []) profMap[p.id]  = p.nickname

    setReports(
      data.map((r: Report) => ({
        ...r,
        dream_title:        dreamMap[r.dream_id]    ?? `#${r.dream_id}`,
        reporter_nickname:  profMap[r.reporter_id]  ?? '알 수 없음',
      }))
    )
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [])

  async function handleDismiss(id: number) {
    const supabase = createClient()
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', id)
    fetchReports()
  }

  async function confirmDeleteDream() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteResult(null)
    const res = await fetch('/api/admin/process-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreamId: deleteTarget.dreamId, reportId: deleteTarget.reportId }),
    })
    const json = await res.json()
    setDeleting(false)
    if (!res.ok) {
      setDeleteResult({ ok: false, msg: json.error ?? '삭제 실패' })
    } else {
      setDeleteResult({
        ok: true,
        msg: `삭제 완료. 구매자 ${json.refunded}명에게 포인트 환불됨.`,
      })
      setDeleteTarget(null)
      fetchReports()
    }
  }

  return (
    <div className="p-4 sm:p-8">
      {deleteResult && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${deleteResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {deleteResult.msg}
          <button onClick={() => setDeleteResult(null)} className="ml-3 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      <h1 className="mb-2 text-xl font-bold text-[#01273A] sm:text-2xl">신고 관리</h1>
      <p className="mb-6 text-sm text-[#999] sm:mb-8">
        사용자 신고 내역을 확인하고 처리합니다.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : reports.length === 0 ? (
        <p className="rounded border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
          신고 내역이 없습니다
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#01273A] text-left text-white">
                <th className="whitespace-nowrap px-4 py-3">신고 일시</th>
                <th className="px-4 py-3">꿈 제목</th>
                <th className="px-4 py-3">신고자</th>
                <th className="px-4 py-3">이유</th>
                <th className="px-4 py-3">상세</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">처리</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/dream/${r.dream_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#01273A] hover:underline"
                    >
                      {r.dream_title}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    @{r.reporter_nickname}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{r.reason}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-gray-500">
                    {r.detail ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDismiss(r.id)}
                          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          반려
                        </button>
                        <button
                          onClick={() => { setDeleteResult(null); setDeleteTarget({ dreamId: r.dream_id, reportId: r.id, dreamTitle: r.dream_title ?? `#${r.dream_id}` }) }}
                          className="rounded border border-red-300 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                        >
                          꿈 삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-[#01273A]">꿈 삭제 확인</h3>
            <p className="mb-1 text-center text-sm text-[#555555]">
              아래 꿈을 삭제하시겠습니까?
            </p>
            <p className="mb-6 text-center text-sm font-semibold text-red-500">
              &ldquo;{deleteTarget.dreamTitle}&rdquo;
            </p>
            <p className="mb-6 text-center text-xs text-[#999]">
              해당 꿈의 구매자에게 포인트가 자동 환불되며, 관련 신고는 처리완료로 변경됩니다.
              삭제 후 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-[#555555] transition hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDeleteDream}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
