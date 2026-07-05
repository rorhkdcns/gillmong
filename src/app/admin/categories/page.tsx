'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

function friendlyError(message: string) {
  if (message.includes('categories_name_key') || message.toLowerCase().includes('name')) {
    return '이미 존재하는 이름입니다.'
  }
  if (message.includes('categories_slug_key') || message.toLowerCase().includes('slug')) {
    return '이미 존재하는 slug입니다.'
  }
  return message
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [dreamCounts, setDreamCounts] = useState<Record<string, number>>({})
  const [loading, setLoading]       = useState(true)

  // 생성 폼
  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating]   = useState(false)
  const [createError, setCreateError] = useState('')

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editSlug, setEditSlug]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [editError, setEditError] = useState('')

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [blockMsg, setBlockMsg]         = useState('')

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, sort_order, is_active')
      .order('sort_order', { ascending: true })
    const cats: Category[] = data ?? []
    setCategories(cats)

    if (cats.length > 0) {
      const counts = await Promise.all(
        cats.map((c: Category) =>
          supabase.from('dreams').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
        )
      )
      const map: Record<string, number> = {}
      cats.forEach((c: Category, i: number) => { map[c.id] = counts[i].count ?? 0 })
      setDreamCounts(map)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  async function handleCreate() {
    setCreateError('')
    if (!name.trim()) { setCreateError('이름을 입력해주세요.'); return }
    const finalSlug = slug.trim() || slugify(name)
    if (!finalSlug) { setCreateError('slug을 입력해주세요.'); return }

    setCreating(true)
    const supabase = createClient()
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1
    const { error } = await supabase.from('categories').insert({
      name: name.trim(),
      slug: finalSlug,
      sort_order: nextOrder,
      is_active: true,
    })
    setCreating(false)

    if (error) { setCreateError(friendlyError(error.message)); return }
    setName(''); setSlug(''); setSlugTouched(false)
    load()
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditError('')
  }

  async function handleSaveEdit(cat: Category) {
    setEditError('')
    if (!editName.trim()) { setEditError('이름을 입력해주세요.'); return }
    if (!editSlug.trim()) { setEditError('slug을 입력해주세요.'); return }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), slug: editSlug.trim() })
      .eq('id', cat.id)
    setSaving(false)

    if (error) { setEditError(friendlyError(error.message)); return }
    setEditingId(null)
    load()
  }

  async function toggleActive(cat: Category) {
    const supabase = createClient()
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    load()
  }

  async function move(cat: Category, direction: 'up' | 'down') {
    const idx = categories.findIndex((c) => c.id === cat.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= categories.length) return
    const other = categories[swapIdx]

    const supabase = createClient()
    await Promise.all([
      supabase.from('categories').update({ sort_order: other.sort_order }).eq('id', cat.id),
      supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', other.id),
    ])
    load()
  }

  function requestDelete(cat: Category) {
    const count = dreamCounts[cat.id] ?? 0
    if (count > 0) {
      setBlockMsg(`이 카테고리에 ${count}개의 꿈이 등록되어 있어 삭제할 수 없습니다. 비활성화를 이용하세요.`)
      return
    }
    setBlockMsg('')
    setDeleteTarget(cat)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-ink sm:mb-8 sm:text-2xl">카테고리 관리</h1>

      {/* 새 카테고리 추가 */}
      <div className="mb-8 max-w-xl space-y-4 rounded border border-gray-200 bg-white p-6">
        <h2 className="text-base font-bold text-brand-ink">새 카테고리 추가</h2>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="예: 인물·신체"
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">slug (URL용)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
            placeholder="이름 입력 시 자동 생성됩니다"
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
          />
          <p className="mt-1 text-xs text-gray-400">직접 수정할 수 있습니다.</p>
        </div>

        {createError && (
          <div className="rounded px-4 py-3 text-sm bg-red-50 text-red-600">{createError}</div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-brand-ink py-3 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
        >
          {creating ? '추가 중...' : '카테고리 추가'}
        </button>
      </div>

      {/* 목록 */}
      <div className="max-w-3xl">
        <h2 className="mb-4 text-base font-bold text-brand-ink">
          등록된 카테고리 ({categories.length}개)
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : categories.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
            등록된 카테고리가 없습니다
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                  <th className="px-4 py-3">순서</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">slug</th>
                  <th className="px-4 py-3">등록된 꿈</th>
                  <th className="px-4 py-3">활성 상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    {editingId === cat.id ? (
                      <>
                        <td className="px-4 py-3 text-[#999]">{cat.sort_order}</td>
                        <td className="px-4 py-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-28 border border-gray-300 px-2 py-1 text-sm outline-none focus:border-brand-violet"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="w-28 border border-gray-300 px-2 py-1 text-sm outline-none focus:border-brand-violet"
                          />
                        </td>
                        <td className="px-4 py-3 text-[#777]">{dreamCounts[cat.id] ?? 0}개</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {cat.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {editError && <p className="text-xs text-red-500">{editError}</p>}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(cat)}
                                disabled={saving}
                                className="rounded bg-brand-ink px-3 py-1 text-xs text-white hover:brightness-90 disabled:opacity-60"
                              >
                                {saving ? '저장 중...' : '저장'}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded border border-gray-300 px-3 py-1 text-xs text-[#555] hover:border-gray-400"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => move(cat, 'up')}
                              disabled={idx === 0}
                              aria-label="위로"
                              className="flex h-6 w-6 items-center justify-center rounded text-[#555] hover:bg-gray-100 disabled:opacity-30"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => move(cat, 'down')}
                              disabled={idx === categories.length - 1}
                              aria-label="아래로"
                              className="flex h-6 w-6 items-center justify-center rounded text-[#555] hover:bg-gray-100 disabled:opacity-30"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-[#333]">{cat.name}</td>
                        <td className="px-4 py-3 font-mono text-[#777]">{cat.slug}</td>
                        <td className="px-4 py-3 text-[#777]">{dreamCounts[cat.id] ?? 0}개</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(cat)}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                              cat.is_active
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {cat.is_active ? '활성' : '비활성'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(cat)}
                              className="rounded border border-gray-300 px-3 py-1 text-xs text-[#555] hover:border-gray-400"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => requestDelete(cat)}
                              className="rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:border-red-400"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 삭제 불가 안내 */}
      {blockMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setBlockMsg('') }}>
          <div className="w-full max-w-sm bg-white p-8 shadow-xl">
            <h2 className="mb-3 text-lg font-bold text-brand-ink">삭제할 수 없습니다</h2>
            <p className="mb-5 text-sm text-[#555]">{blockMsg}</p>
            <button onClick={() => setBlockMsg('')} className="w-full rounded border border-gray-300 py-2 text-sm text-[#555] hover:border-gray-400">
              확인
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="w-full max-w-sm bg-white p-8 shadow-xl">
            <h2 className="mb-3 text-lg font-bold text-red-600">카테고리 삭제</h2>
            <p className="mb-5 text-sm text-[#777]">
              <span className="font-semibold text-[#333]">&ldquo;{deleteTarget.name}&rdquo;</span>을(를) 삭제합니다.<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-300 py-2 text-sm text-[#555]">취소</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
