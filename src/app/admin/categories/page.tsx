'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategoryActive,
  reorderAdminCategories,
  deleteAdminCategory,
  uploadAdminCategoryImage,
} from '../actions'

type Domain = 'dream' | 'shop'

interface Category {
  id: string
  name: string
  slug: string
  domain: Domain
  parent_id: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

// 제휴사 도메인은 나중에 여기에 { value: 'affiliate', label: '제휴사 카테고리' }만 추가하면 됨.
const DOMAIN_TABS: { value: Domain; label: string }[] = [
  { value: 'dream', label: '꿈 카테고리' },
  { value: 'shop',  label: '쇼핑몰 카테고리' },
]

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
  if (message.includes('categories_domain_parent_name')) {
    return '같은 상위 카테고리 안에 이미 존재하는 이름입니다.'
  }
  if (message.includes('categories_domain_slug_key')) {
    return '이미 존재하는 slug입니다.'
  }
  return message
}

export default function AdminCategoriesPage() {
  const [activeDomain, setActiveDomain] = useState<Domain>('dream')
  const [categories, setCategories]     = useState<Category[]>([])
  const [dreamCounts, setDreamCounts]   = useState<Record<string, number>>({})
  const [loading, setLoading]           = useState(true)

  // 생성 폼
  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [parentId, setParentId]   = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [creating, setCreating]   = useState(false)
  const [createError, setCreateError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editSlug, setEditSlug]   = useState('')
  const [editParentId, setEditParentId] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [saving, setSaving]       = useState(false)
  const [editError, setEditError] = useState('')

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [blockMsg, setBlockMsg]         = useState('')

  const isShop = activeDomain === 'shop'
  const topLevelOptions = categories.filter((c) => c.parent_id === null)

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, domain, parent_id, image_url, sort_order, is_active')
      .eq('domain', activeDomain)
      .order('sort_order', { ascending: true })
    const cats: Category[] = data ?? []
    setCategories(cats)

    if (activeDomain === 'dream' && cats.length > 0) {
      const counts = await Promise.all(
        cats.map((c: Category) =>
          supabase.from('dreams').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
        )
      )
      const map: Record<string, number> = {}
      cats.forEach((c: Category, i: number) => { map[c.id] = counts[i].count ?? 0 })
      setDreamCounts(map)
    } else {
      setDreamCounts({})
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [activeDomain])

  function switchTab(d: Domain) {
    if (d === activeDomain) return
    setActiveDomain(d)
    resetCreateForm()
    setEditingId(null)
  }

  function resetCreateForm() {
    setName(''); setSlug(''); setSlugTouched(false)
    setParentId('')
    setImageFile(null); setImagePreview('')
    setCreateError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
  }

  async function handleCreate() {
    setCreateError('')
    if (!name.trim()) { setCreateError('이름을 입력해주세요.'); return }
    const finalSlug = slug.trim() || slugify(name)
    if (!finalSlug) { setCreateError('slug을 입력해주세요.'); return }

    setCreating(true)

    let imageUrl: string | null = null
    if (isShop && imageFile) {
      const fd = new FormData()
      fd.append('file', imageFile)
      const { url, error: uploadError } = await uploadAdminCategoryImage(fd)
      if (uploadError) { setCreateError(`이미지 업로드 실패: ${uploadError}`); setCreating(false); return }
      imageUrl = url ?? null
    }

    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1
    const { error } = await createAdminCategory(
      {
        name: name.trim(),
        slug: finalSlug,
        domain: activeDomain,
        parentId: isShop && parentId ? parentId : null,
        imageUrl,
      },
      nextOrder,
    )
    setCreating(false)

    if (error) { setCreateError(friendlyError(error)); return }
    resetCreateForm()
    load()
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditParentId(cat.parent_id ?? '')
    setEditImageFile(null)
    setEditImagePreview(cat.image_url ?? '')
    setEditError('')
  }

  async function handleSaveEdit(cat: Category) {
    setEditError('')
    if (!editName.trim()) { setEditError('이름을 입력해주세요.'); return }
    if (!editSlug.trim()) { setEditError('slug을 입력해주세요.'); return }

    setSaving(true)

    let imageUrl = cat.image_url
    if (isShop && editImageFile) {
      const fd = new FormData()
      fd.append('file', editImageFile)
      const { url, error: uploadError } = await uploadAdminCategoryImage(fd)
      if (uploadError) { setEditError(`이미지 업로드 실패: ${uploadError}`); setSaving(false); return }
      imageUrl = url ?? null
    }

    const { error } = await updateAdminCategory(cat.id, {
      name: editName.trim(),
      slug: editSlug.trim(),
      parentId: isShop && editParentId ? editParentId : null,
      imageUrl: isShop ? imageUrl : null,
    })
    setSaving(false)

    if (error) { setEditError(friendlyError(error)); return }
    setEditingId(null)
    load()
  }

  async function toggleActive(cat: Category) {
    const { error } = await toggleAdminCategoryActive(cat.id, !cat.is_active)
    if (error) { setBlockMsg(`활성 상태 변경 실패: ${error}`); return }
    load()
  }

  async function move(cat: Category, direction: 'up' | 'down') {
    const idx = categories.findIndex((c) => c.id === cat.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= categories.length) return
    const other = categories[swapIdx]

    const { error } = await reorderAdminCategories(cat.id, other.sort_order, other.id, cat.sort_order)
    if (error) { setBlockMsg(`순서 변경 실패: ${error}`); return }
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
    const { error } = await deleteAdminCategory(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (error) { setBlockMsg(`삭제 실패: ${error}`); return }
    load()
  }

  function parentName(id: string | null) {
    if (!id) return '—'
    return categories.find((c) => c.id === id)?.name ?? '—'
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-ink sm:mb-8 sm:text-2xl">카테고리 관리</h1>

      {/* 도메인 탭 */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {DOMAIN_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => switchTab(tab.value)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeDomain === tab.value
                ? 'border-b-2 border-brand-ink text-brand-ink'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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

        {isShop && (
          <>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">상위 카테고리</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
              >
                <option value="">없음 (최상위 카테고리)</option>
                {topLevelOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">썸네일 이미지</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-600 file:mr-3 file:border-0 file:bg-brand-ink file:px-4 file:py-2 file:text-white file:text-sm file:cursor-pointer hover:file:brightness-90"
              />
              {imagePreview && (
                <img src={imagePreview} alt="미리보기" className="mt-3 h-20 w-20 rounded object-cover" />
              )}
            </div>
          </>
        )}

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
      <div className="max-w-4xl">
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
                  {isShop && <th className="px-4 py-3">상위 카테고리</th>}
                  {isShop && <th className="px-4 py-3">이미지</th>}
                  {!isShop && <th className="px-4 py-3">등록된 꿈</th>}
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
                        {isShop && (
                          <td className="px-4 py-3">
                            <select
                              value={editParentId}
                              onChange={(e) => setEditParentId(e.target.value)}
                              className="w-32 border border-gray-300 px-2 py-1 text-sm outline-none focus:border-brand-violet"
                            >
                              <option value="">없음 (최상위)</option>
                              {topLevelOptions.filter((c) => c.id !== cat.id).map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        {isShop && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {editImagePreview && (
                                <img src={editImagePreview} alt="" className="h-10 w-10 rounded object-cover" />
                              )}
                              <input type="file" accept="image/*" onChange={handleEditImageChange} className="w-32 text-xs text-gray-500" />
                            </div>
                          </td>
                        )}
                        {!isShop && <td className="px-4 py-3 text-[#777]">{dreamCounts[cat.id] ?? 0}개</td>}
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
                        {isShop && <td className="px-4 py-3 text-[#777]">{parentName(cat.parent_id)}</td>}
                        {isShop && (
                          <td className="px-4 py-3">
                            {cat.image_url ? (
                              <img src={cat.image_url} alt="" className="h-10 w-10 rounded object-cover bg-gray-100" />
                            ) : (
                              <span className="text-xs text-gray-300">없음</span>
                            )}
                          </td>
                        )}
                        {!isShop && <td className="px-4 py-3 text-[#777]">{dreamCounts[cat.id] ?? 0}개</td>}
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
