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
type ShopLevel = 'root' | 'mid' | 'leaf'

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

interface TreeNode extends Category {
  depth: 0 | 1 | 2
  path: Category[] // 최상위부터 바로 위 부모까지 (자기 자신 제외)
  children: TreeNode[]
}

// 제휴사 도메인은 나중에 여기에 { value: 'affiliate', label: '제휴사 카테고리' }만 추가하면 됨.
const DOMAIN_TABS: { value: Domain; label: string }[] = [
  { value: 'dream', label: '꿈 카테고리' },
  { value: 'shop',  label: '쇼핑몰 카테고리' },
]

const LEVEL_LABEL = ['대분류', '중분류', '소분류'] as const

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

function buildTree(categories: Category[]): TreeNode[] {
  const byParent = new Map<string | null, Category[]>()
  for (const c of categories) {
    const key = c.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  for (const list of byParent.values()) list.sort((a, b) => a.sort_order - b.sort_order)

  function build(parentId: string | null, depth: 0 | 1 | 2, path: Category[]): TreeNode[] {
    const kids = byParent.get(parentId) ?? []
    return kids.map((c) => {
      const node: TreeNode = { ...c, depth, path, children: [] }
      if (depth < 2) node.children = build(c.id, (depth + 1) as 0 | 1 | 2, [...path, c])
      return node
    })
  }
  return build(null, 0, [])
}

function flattenVisible(nodes: TreeNode[], expanded: Set<string>): TreeNode[] {
  const out: TreeNode[] = []
  for (const n of nodes) {
    out.push(n)
    if (n.children.length > 0 && expanded.has(n.id)) {
      out.push(...flattenVisible(n.children, expanded))
    }
  }
  return out
}

function depthOf(cat: Category, all: Category[]): number {
  let depth = 0
  let current = cat
  while (current.parent_id) {
    const parent = all.find((c) => c.id === current.parent_id)
    if (!parent) break
    depth++
    current = parent
  }
  return depth
}

export default function AdminCategoriesPage() {
  const [activeDomain, setActiveDomain] = useState<Domain>('dream')
  const [categories, setCategories]     = useState<Category[]>([])
  const [dreamCounts, setDreamCounts]   = useState<Record<string, number>>({})
  const [expanded, setExpanded]         = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(true)

  // 생성 폼 (꿈 탭 + 쇼핑몰 대분류 공용)
  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [creating, setCreating]   = useState(false)
  const [createError, setCreateError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // 생성 폼 - 쇼핑몰 전용 (단계 선택)
  const [createLevel, setCreateLevel]   = useState<ShopLevel>('root')
  const [createRootId, setCreateRootId] = useState('')
  const [createMidId, setCreateMidId]   = useState('')

  // 수정 상태 - 꿈 탭 (인라인)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editSlug, setEditSlug]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [editError, setEditError] = useState('')

  // 수정 상태 - 쇼핑몰 탭 (모달)
  const [editTarget, setEditTarget]   = useState<Category | null>(null)
  const [shopEditName, setShopEditName] = useState('')
  const [shopEditSlug, setShopEditSlug] = useState('')
  const [shopEditRootId, setShopEditRootId] = useState('')
  const [shopEditMidId, setShopEditMidId]   = useState('')
  const [shopEditImageFile, setShopEditImageFile] = useState<File | null>(null)
  const [shopEditImagePreview, setShopEditImagePreview] = useState('')
  const [shopSaving, setShopSaving] = useState(false)
  const [shopEditError, setShopEditError] = useState('')

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [blockMsg, setBlockMsg]         = useState('')

  const isShop = activeDomain === 'shop'
  const rootOptions = categories.filter((c) => c.parent_id === null)
  const midOptionsFor = (rootId: string) => categories.filter((c) => c.parent_id === rootId)

  const tree = isShop ? buildTree(categories) : []
  const visibleRows = isShop ? flattenVisible(tree, expanded) : []

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

    if (activeDomain === 'shop') {
      const parentIds = new Set(cats.map((c) => c.parent_id).filter((id): id is string => !!id))
      setExpanded(parentIds)
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [activeDomain])

  function switchTab(d: Domain) {
    if (d === activeDomain) return
    setActiveDomain(d)
    resetCreateForm()
    setEditingId(null)
    setEditTarget(null)
  }

  function resetCreateForm() {
    setName(''); setSlug(''); setSlugTouched(false)
    setImageFile(null); setImagePreview('')
    setCreateLevel('root'); setCreateRootId(''); setCreateMidId('')
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

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreate() {
    setCreateError('')
    if (!name.trim()) { setCreateError('이름을 입력해주세요.'); return }
    const finalSlug = slug.trim() || slugify(name)
    if (!finalSlug) { setCreateError('slug을 입력해주세요.'); return }

    let parentId: string | null = null
    if (isShop) {
      if (createLevel === 'mid') {
        if (!createRootId) { setCreateError('상위 대분류를 선택해주세요.'); return }
        parentId = createRootId
      } else if (createLevel === 'leaf') {
        if (!createRootId) { setCreateError('상위 대분류를 선택해주세요.'); return }
        if (!createMidId) { setCreateError('상위 중분류를 선택해주세요.'); return }
        parentId = createMidId
      }
    }

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
        parentId,
        imageUrl,
      },
      nextOrder,
    )
    setCreating(false)

    if (error) { setCreateError(friendlyError(error)); return }
    resetCreateForm()
    load()
  }

  // ── 꿈 탭 인라인 수정 ─────────────────────────────
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
    const { error } = await updateAdminCategory(cat.id, {
      name: editName.trim(),
      slug: editSlug.trim(),
      parentId: null,
      imageUrl: null,
    })
    setSaving(false)

    if (error) { setEditError(friendlyError(error)); return }
    setEditingId(null)
    load()
  }

  // ── 쇼핑몰 탭 수정 모달 ───────────────────────────
  function startShopEdit(cat: Category) {
    const depth = depthOf(cat, categories)
    setEditTarget(cat)
    setShopEditName(cat.name)
    setShopEditSlug(cat.slug)
    setShopEditImageFile(null)
    setShopEditImagePreview(cat.image_url ?? '')
    setShopEditError('')

    if (depth === 1) {
      setShopEditRootId(cat.parent_id ?? '')
      setShopEditMidId('')
    } else if (depth === 2) {
      const mid = categories.find((c) => c.id === cat.parent_id) ?? null
      setShopEditRootId(mid?.parent_id ?? '')
      setShopEditMidId(cat.parent_id ?? '')
    } else {
      setShopEditRootId(''); setShopEditMidId('')
    }
  }

  function handleShopEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setShopEditImageFile(file)
    setShopEditImagePreview(URL.createObjectURL(file))
  }

  async function handleSaveShopEdit() {
    if (!editTarget) return
    setShopEditError('')
    if (!shopEditName.trim()) { setShopEditError('이름을 입력해주세요.'); return }
    if (!shopEditSlug.trim()) { setShopEditError('slug을 입력해주세요.'); return }

    const depth = depthOf(editTarget, categories)
    let parentId: string | null = null
    if (depth === 1) {
      if (!shopEditRootId) { setShopEditError('상위 대분류를 선택해주세요.'); return }
      parentId = shopEditRootId
    } else if (depth === 2) {
      if (!shopEditRootId) { setShopEditError('상위 대분류를 선택해주세요.'); return }
      if (!shopEditMidId) { setShopEditError('상위 중분류를 선택해주세요.'); return }
      parentId = shopEditMidId
    }

    setShopSaving(true)

    let imageUrl = editTarget.image_url
    if (shopEditImageFile) {
      const fd = new FormData()
      fd.append('file', shopEditImageFile)
      const { url, error: uploadError } = await uploadAdminCategoryImage(fd)
      if (uploadError) { setShopEditError(`이미지 업로드 실패: ${uploadError}`); setShopSaving(false); return }
      imageUrl = url ?? null
    }

    const { error } = await updateAdminCategory(editTarget.id, {
      name: shopEditName.trim(),
      slug: shopEditSlug.trim(),
      parentId,
      imageUrl,
    })
    setShopSaving(false)

    if (error) { setShopEditError(friendlyError(error)); return }
    setEditTarget(null)
    load()
  }

  async function toggleActive(cat: Category) {
    const { error } = await toggleAdminCategoryActive(cat.id, !cat.is_active)
    if (error) { setBlockMsg(`활성 상태 변경 실패: ${error}`); return }
    load()
  }

  async function move(cat: Category, direction: 'up' | 'down') {
    const siblings = categories
      .filter((c) => c.parent_id === cat.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = siblings.findIndex((c) => c.id === cat.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const other = siblings[swapIdx]

    const { error } = await reorderAdminCategories(cat.id, other.sort_order, other.id, cat.sort_order)
    if (error) { setBlockMsg(`순서 변경 실패: ${error}`); return }
    load()
  }

  function requestDelete(cat: Category) {
    if (isShop) {
      const childCount = categories.filter((c) => c.parent_id === cat.id).length
      if (childCount > 0) {
        setBlockMsg(`하위 카테고리 ${childCount}개를 먼저 삭제하거나 다른 곳으로 이동한 후 삭제 가능합니다.`)
        return
      }
    } else {
      const count = dreamCounts[cat.id] ?? 0
      if (count > 0) {
        setBlockMsg(`이 카테고리에 ${count}개의 꿈이 등록되어 있어 삭제할 수 없습니다. 비활성화를 이용하세요.`)
        return
      }
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

        {isShop && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#333]">단계</label>
            <select
              value={createLevel}
              onChange={(e) => {
                const v = e.target.value as ShopLevel
                setCreateLevel(v)
                setCreateRootId(''); setCreateMidId('')
                setCreateError('')
              }}
              className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
            >
              <option value="root">대분류로 추가</option>
              <option value="mid">중분류로 추가</option>
              <option value="leaf">소분류로 추가</option>
            </select>
          </div>
        )}

        {isShop && createLevel === 'mid' && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#333]">어느 대분류 밑에?</label>
            {rootOptions.length === 0 ? (
              <p className="text-sm text-red-500">먼저 대분류를 하나 이상 만들어주세요.</p>
            ) : (
              <select
                value={createRootId}
                onChange={(e) => setCreateRootId(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
              >
                <option value="">선택해주세요</option>
                {rootOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        )}

        {isShop && createLevel === 'leaf' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">어느 대분류 밑에?</label>
              {rootOptions.length === 0 ? (
                <p className="text-sm text-red-500">먼저 대분류를 하나 이상 만들어주세요.</p>
              ) : (
                <select
                  value={createRootId}
                  onChange={(e) => { setCreateRootId(e.target.value); setCreateMidId('') }}
                  className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
                >
                  <option value="">선택해주세요</option>
                  {rootOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            {createRootId && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#333]">어느 중분류 밑에?</label>
                {midOptionsFor(createRootId).length === 0 ? (
                  <p className="text-sm text-red-500">이 대분류 밑에 중분류를 먼저 만들어주세요.</p>
                ) : (
                  <select
                    value={createMidId}
                    onChange={(e) => setCreateMidId(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
                  >
                    <option value="">선택해주세요</option>
                    {midOptionsFor(createRootId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            )}
          </>
        )}

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
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#333]">썸네일 이미지 (선택)</label>
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
        ) : isShop ? (
          // ── 쇼핑몰 탭: 트리 ──────────────────────────
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                  <th className="px-4 py-3">순서</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">slug</th>
                  <th className="px-4 py-3">등록된 상품</th>
                  <th className="px-4 py-3">활성 상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRows.map((node) => {
                  const siblings = categories
                    .filter((c) => c.parent_id === node.parent_id)
                    .sort((a, b) => a.sort_order - b.sort_order)
                  const siblingIdx = siblings.findIndex((c) => c.id === node.id)
                  const hasChildren = node.children.length > 0
                  const isExpanded = expanded.has(node.id)

                  return (
                    <tr key={node.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => move(node, 'up')}
                            disabled={siblingIdx === 0}
                            aria-label="위로"
                            className="flex h-6 w-6 items-center justify-center rounded text-[#555] hover:bg-gray-100 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => move(node, 'down')}
                            disabled={siblingIdx === siblings.length - 1}
                            aria-label="아래로"
                            className="flex h-6 w-6 items-center justify-center rounded text-[#555] hover:bg-gray-100 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ paddingLeft: `${node.depth * 20}px` }} className="flex items-center gap-1.5">
                          {hasChildren ? (
                            <button
                              onClick={() => toggleExpand(node.id)}
                              aria-label={isExpanded ? '접기' : '펼치기'}
                              className="flex h-5 w-5 shrink-0 items-center justify-center text-[#999] hover:text-[#555]"
                            >
                              {isExpanded ? '▾' : '▸'}
                            </button>
                          ) : (
                            <span className="inline-block w-5 shrink-0" />
                          )}
                          <span className="font-medium text-[#333]">{node.name}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {LEVEL_LABEL[node.depth]}
                          </span>
                          {node.depth === 2 && node.path.length > 0 && (
                            <span className="text-xs text-gray-400">
                              ({node.path.map((p) => p.name).join(' > ')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#777]">{node.slug}</td>
                      <td className="px-4 py-3 text-[#777]">0개</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(node)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            node.is_active
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {node.is_active ? '활성' : '비활성'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startShopEdit(node)}
                            className="rounded border border-gray-300 px-3 py-1 text-xs text-[#555] hover:border-gray-400"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => requestDelete(node)}
                            className="rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:border-red-400"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // ── 꿈 탭: 기존 평면 목록 ────────────────────
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

      {/* 쇼핑몰 카테고리 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null) }}>
          <div className="w-full max-w-md space-y-4 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-bold text-brand-ink">
              {LEVEL_LABEL[depthOf(editTarget, categories)]} 수정
            </h2>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">이름</label>
              <input
                value={shopEditName}
                onChange={(e) => setShopEditName(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">slug</label>
              <input
                value={shopEditSlug}
                onChange={(e) => setShopEditSlug(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
              />
            </div>

            {depthOf(editTarget, categories) === 1 && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#333]">상위 대분류</label>
                <select
                  value={shopEditRootId}
                  onChange={(e) => setShopEditRootId(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
                >
                  <option value="">선택해주세요</option>
                  {rootOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {depthOf(editTarget, categories) === 2 && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#333]">상위 대분류</label>
                  <select
                    value={shopEditRootId}
                    onChange={(e) => { setShopEditRootId(e.target.value); setShopEditMidId('') }}
                    className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
                  >
                    <option value="">선택해주세요</option>
                    {rootOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#333]">상위 중분류</label>
                  {!shopEditRootId ? (
                    <p className="text-sm text-gray-400">먼저 대분류를 선택해주세요.</p>
                  ) : midOptionsFor(shopEditRootId).length === 0 ? (
                    <p className="text-sm text-red-500">이 대분류 밑에 중분류가 없습니다.</p>
                  ) : (
                    <select
                      value={shopEditMidId}
                      onChange={(e) => setShopEditMidId(e.target.value)}
                      className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-violet"
                    >
                      <option value="">선택해주세요</option>
                      {midOptionsFor(shopEditRootId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#333]">썸네일 이미지</label>
              <input type="file" accept="image/*" onChange={handleShopEditImageChange}
                className="w-full text-sm text-gray-600 file:mr-3 file:border-0 file:bg-brand-ink file:px-4 file:py-2 file:text-white file:text-sm file:cursor-pointer hover:file:brightness-90" />
              {shopEditImagePreview && (
                <img src={shopEditImagePreview} alt="미리보기" className="mt-3 h-20 w-20 rounded object-cover" />
              )}
            </div>

            {shopEditError && (
              <div className="rounded px-4 py-3 text-sm bg-red-50 text-red-600">{shopEditError}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setEditTarget(null)} className="flex-1 border border-gray-300 py-2 text-sm text-[#555]">취소</button>
              <button
                onClick={handleSaveShopEdit}
                disabled={shopSaving}
                className="flex-1 bg-brand-ink py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
              >
                {shopSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

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
