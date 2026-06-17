'use client'

import { useState, useEffect } from 'react'
import { createAdminNotice, deleteAdminNotice, getAdminNotices } from '../actions'

type Notice = { id: number; title: string; is_pinned: boolean; created_at: string }

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default function AdminNoticePage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    const data = await getAdminNotices()
    setNotices(data as Notice[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 모두 입력해주세요.'); return }
    setSaving(true)
    setError('')
    const result = await createAdminNotice(title, content, isPinned)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setTitle(''); setContent(''); setIsPinned(false); setShowForm(false)
    load()
  }

  async function handleDelete(id: number) {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return
    await deleteAdminNotice(id)
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#01273A]">공지사항 관리</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded bg-[#01273A] px-4 py-2 text-sm font-semibold text-white hover:brightness-90"
        >
          {showForm ? '취소' : '+ 공지 작성'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-[#01273A]">새 공지사항</h2>
          <div className="mb-3">
            <label className="mb-1 block text-sm text-[#555]">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#01273A]"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm text-[#555]">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="공지 내용"
              className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#01273A]"
            />
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm text-[#555]">
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="accent-[#01273A]" />
            상단 고정 (공지)
          </label>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-[#01273A] px-5 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
          >
            {saving ? '저장 중...' : '공지 등록'}
          </button>
        </form>
      )}

      <div className="rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-[#01273A]">공지사항 목록</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">등록된 공지사항이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                <th className="px-6 py-3">제목</th>
                <th className="px-6 py-3">고정</th>
                <th className="px-6 py-3">날짜</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notices.map((n) => (
                <tr key={n.id}>
                  <td className="px-6 py-3">
                    <a href={`/notice/${n.id}`} target="_blank" rel="noopener noreferrer" className="text-[#333] hover:underline">
                      {n.title}
                    </a>
                  </td>
                  <td className="px-6 py-3">
                    {n.is_pinned && <span className="rounded bg-[#01273A] px-2 py-0.5 text-[10px] font-bold text-white">고정</span>}
                  </td>
                  <td className="px-6 py-3 text-[#999]">{formatDate(n.created_at)}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
