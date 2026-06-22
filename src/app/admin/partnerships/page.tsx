'use client'

import { useState, useEffect } from 'react'
import { getPartnershipInquiries, updatePartnershipStatus } from './actions'

type Inquiry = Awaited<ReturnType<typeof getPartnershipInquiries>>[number]

const STATUS_LABEL: Record<string, string> = {
  new:       '신규',
  reviewing: '검토중',
  done:      '완료',
}
const STATUS_COLOR: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  reviewing: 'bg-amber-100 text-amber-700',
  done:      'bg-emerald-100 text-emerald-700',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function AdminPartnershipsPage() {
  const [list, setList]         = useState<Inquiry[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [note, setNote]         = useState('')
  const [status, setStatus]     = useState<'new' | 'reviewing' | 'done'>('new')
  const [saving, setSaving]     = useState(false)

  async function load() {
    setLoading(true)
    setList(await getPartnershipInquiries())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openItem(item: Inquiry) {
    if (expanded === item.id) { setExpanded(null); return }
    setExpanded(item.id)
    setNote(item.admin_note ?? '')
    setStatus((item.status as 'new' | 'reviewing' | 'done') ?? 'new')
  }

  async function handleSave(id: number) {
    setSaving(true)
    await updatePartnershipStatus(id, status, note)
    setSaving(false)
    setExpanded(null)
    load()
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-2 text-xl font-bold text-[#01273A] sm:text-2xl">제휴문의 관리</h1>
      <p className="mb-6 text-sm text-[#999] sm:mb-8">고객사의 제휴 문의 내역을 확인하고 처리합니다.</p>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : list.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
          제휴 문의가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div key={item.id} className="rounded border border-gray-200 bg-white">
              {/* 목록 행 */}
              <button
                onClick={() => openItem(item)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  <span className="truncate text-sm font-medium text-[#333]">{item.title}</span>
                  <span className="hidden shrink-0 text-xs text-gray-400 sm:block">
                    {item.name}{item.company ? ` · ${item.company}` : ''}
                  </span>
                </div>
                <span className="ml-4 shrink-0 text-xs text-gray-400">{formatDate(item.created_at)}</span>
              </button>

              {/* 상세 패널 */}
              {expanded === item.id && (
                <div className="border-t border-gray-100 px-5 py-5">
                  {/* 문의자 정보 */}
                  <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <div><span className="text-xs text-gray-400">이름</span><p className="font-medium text-[#333]">{item.name}</p></div>
                    <div><span className="text-xs text-gray-400">이메일</span><p className="font-medium text-[#333]">{item.email}</p></div>
                    {item.company && <div><span className="text-xs text-gray-400">회사명</span><p className="font-medium text-[#333]">{item.company}</p></div>}
                    {item.phone   && <div><span className="text-xs text-gray-400">연락처</span><p className="font-medium text-[#333]">{item.phone}</p></div>}
                  </div>

                  {/* 문의 내용 */}
                  <div className="mb-4 rounded-lg bg-gray-50 p-4">
                    <p className="mb-1 text-xs font-semibold text-gray-400">문의 내용</p>
                    <p className="whitespace-pre-line text-sm text-[#333]">{item.content}</p>
                  </div>

                  {/* 처리 영역 */}
                  <div className="space-y-3">
                    {/* 상태 변경 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">상태</span>
                      {(['new', 'reviewing', 'done'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`rounded px-3 py-1 text-xs font-semibold transition ${
                            status === s ? STATUS_COLOR[s] : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>

                    {/* 관리자 메모 */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">관리자 메모</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="처리 메모 또는 답변 내용을 입력하세요"
                        className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#01273A]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={saving}
                        className="rounded bg-[#01273A] px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => setExpanded(null)}
                        className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
