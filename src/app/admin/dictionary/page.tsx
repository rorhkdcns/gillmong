'use client'

import { useState, useEffect } from 'react'
import {
  createAdminDictionaryEntry,
  deleteAdminDictionaryEntry,
  getAdminDictionaryEntries,
  getAdminDictionaryEntryById,
  updateAdminDictionaryEntry,
  type AdminDictionaryFields,
} from '../actions'

type Entry = {
  id: string
  slug: string
  keyword: string
  category_slug: string | null
  is_published: boolean
  view_count: number
  updated_at: string
}
type FormMode = 'create' | 'edit'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export default function AdminDictionaryPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editId,   setEditId]   = useState<string | null>(null)
  const [slug,          setSlug]          = useState('')
  const [keyword,       setKeyword]       = useState('')
  const [summary,       setSummary]       = useState('')
  const [body,          setBody]          = useState('')
  const [categorySlug,  setCategorySlug]  = useState('')
  const [tagsInput,     setTagsInput]     = useState('')
  const [isPublished,   setIsPublished]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [showForm, setShowForm] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await getAdminDictionaryEntries()
    setEntries(data as Entry[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setSlug(''); setKeyword(''); setSummary(''); setBody('')
    setCategorySlug(''); setTagsInput(''); setIsPublished(false)
    setError('')
  }

  function openCreateForm() {
    setFormMode('create')
    setEditId(null)
    resetForm()
    setShowForm(true)
  }

  async function openEditForm(id: string) {
    setError('')
    setShowForm(true)
    setFormMode('edit')
    setEditId(id)
    setKeyword('로딩 중...')
    const entry = await getAdminDictionaryEntryById(id) as {
      slug: string; keyword: string; summary: string; body: string
      category_slug: string | null; tags: string[] | null; is_published: boolean
    } | null
    if (!entry) { setError('사전 항목을 불러올 수 없습니다.'); return }
    setSlug(entry.slug)
    setKeyword(entry.keyword)
    setSummary(entry.summary)
    setBody(entry.body)
    setCategorySlug(entry.category_slug ?? '')
    setTagsInput((entry.tags ?? []).join(', '))
    setIsPublished(entry.is_published)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalSlug = slug.trim()
    if (!finalSlug) { setError('slug을 입력해주세요.'); return }
    if (!SLUG_PATTERN.test(finalSlug)) { setError('slug은 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'); return }
    if (!keyword.trim()) { setError('키워드를 입력해주세요.'); return }
    if (!summary.trim()) { setError('요약을 입력해주세요.'); return }
    if (!body.trim())    { setError('본문을 입력해주세요.'); return }

    const fields: AdminDictionaryFields = {
      slug: finalSlug,
      keyword: keyword.trim(),
      summary: summary.trim(),
      body: body.trim(),
      categorySlug: categorySlug.trim() || null,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      isPublished,
    }

    setSaving(true)
    setError('')
    const result = formMode === 'edit' && editId
      ? await updateAdminDictionaryEntry(editId, fields)
      : await createAdminDictionaryEntry(fields)
    setSaving(false)

    if (result.error) { setError(result.error); return }
    closeForm()
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteAdminDictionaryEntry(deleteTarget)
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-xl font-bold text-brand-ink sm:text-2xl">해몽 사전 관리</h1>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90"
        >
          {showForm ? '취소' : '+ 새 항목'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-2xl space-y-4 rounded border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-brand-ink">
            {formMode === 'edit' ? '사전 항목 수정' : '새 사전 항목'}
          </h2>

          <div>
            <label className="mb-1 block text-sm text-[#555]">slug (URL용, 영문 소문자+하이픈만)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="예: pig-dream"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">키워드</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 돼지꿈"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">요약 (리드 문단)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">본문</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="문단 사이는 빈 줄로 구분해주세요."
              className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">카테고리 slug (선택, 꿈 카테고리와 매칭)</label>
            <input
              type="text"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder="예: animals"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="예: 돼지, 재물운, 태몽"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#555]">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-brand-ink" />
            발행 (체크 시 공개 페이지에 노출)
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-brand-ink px-5 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
            >
              {saving ? '저장 중...' : formMode === 'edit' ? '수정 완료' : '등록'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-brand-ink">등록된 항목 ({entries.length}개)</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">등록된 사전 항목이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                <th className="px-6 py-3">키워드</th>
                <th className="px-6 py-3">카테고리</th>
                <th className="px-6 py-3">발행상태</th>
                <th className="px-6 py-3">조회수</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-6 py-3 font-medium text-[#333]">{e.keyword}</td>
                  <td className="px-6 py-3 text-[#777]">{e.category_slug ?? '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {e.is_published ? '발행됨' : '비공개'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[#777]">{e.view_count.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditForm(e.id)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                      <button onClick={() => setDeleteTarget(e.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-brand-ink">사전 항목 삭제</h3>
            <p className="mb-6 text-center text-sm text-[#555]">이 항목을 삭제하시겠습니까?<br />삭제 후 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-50">
                취소
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                {deleting ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
