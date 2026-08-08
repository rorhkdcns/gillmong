'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getAdminShopCategories,
  createAdminShopCategory,
  updateAdminShopCategory,
  deleteAdminShopCategory,
  getAdminShopSubcategories,
  createAdminShopSubcategory,
  updateAdminShopSubcategory,
  deleteAdminShopSubcategory,
  getAdminShopProducts,
  getAdminAffiliateProductById,
  createAdminAffiliateProduct,
  updateAdminAffiliateProduct,
  deleteAdminAffiliateProduct,
  type AdminAffiliateFields,
} from '../actions'
import ImageThumbnail from '@/components/ImageThumbnail'

type ShopCategory = { id: string; name: string; slug: string; sort_order: number; is_active: boolean }
type ShopSubcategory = { id: string; category_id: string; name: string; slug: string; sort_order: number; is_active: boolean }
type ShopProduct = {
  id: string
  title: string
  price_text: string | null
  image_url: string | null
  link_url: string
  tags: string[] | null
  sort_order: number
  is_active: boolean
  shop_category_id: string | null
  shop_subcategory_id: string | null
}

type StatusFilter = 'all' | 'published' | 'unpublished'
type DeleteTarget = { type: 'category' | 'subcategory' | 'product'; id: string; label: string }

const ALL = 'all'
const UNCATEGORIZED = '__uncategorized__'
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function matchesStatus(p: ShopProduct, filter: StatusFilter): boolean {
  if (filter === 'published') return p.is_active
  if (filter === 'unpublished') return !p.is_active
  return true
}

export default function AdminShopProductsPage() {
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [subcategories, setSubcategories] = useState<ShopSubcategory[]>([])
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function load() {
    setLoading(true)
    setLoadError('')
    const [catRes, subRes, prodRes] = await Promise.all([
      getAdminShopCategories(),
      getAdminShopSubcategories(),
      getAdminShopProducts(),
    ])
    const err = catRes.error ?? subRes.error ?? prodRes.error
    if (err) setLoadError(err)
    setCategories(catRes.data as ShopCategory[])
    setSubcategories(subRes.data as ShopSubcategory[])
    setProducts(prodRes.data as ShopProduct[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? null
  const subcategoryName = (id: string | null) => subcategories.find((s) => s.id === id)?.name ?? null

  // ── 통합 삭제 확인 모달 ─────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    if (deleteTarget.type === 'category') await deleteAdminShopCategory(deleteTarget.id)
    else if (deleteTarget.type === 'subcategory') await deleteAdminShopSubcategory(deleteTarget.id)
    else await deleteAdminAffiliateProduct(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  // ── 카테고리 관리 ───────────────────────────────────────────────
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)
  const [catFormOpen, setCatFormOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catSortOrder, setCatSortOrder] = useState('0')
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState('')

  function openCreateCat() {
    setCatFormOpen(true); setCatEditId(null)
    setCatName(''); setCatSlug(''); setCatSortOrder('0'); setCatError('')
  }
  function openEditCat(c: ShopCategory) {
    setCatFormOpen(true); setCatEditId(c.id)
    setCatName(c.name); setCatSlug(c.slug); setCatSortOrder(String(c.sort_order)); setCatError('')
  }
  function closeCatForm() { setCatFormOpen(false); setCatEditId(null) }

  async function submitCatForm(e: React.FormEvent) {
    e.preventDefault()
    const slug = catSlug.trim()
    if (!catName.trim()) { setCatError('이름을 입력해주세요.'); return }
    if (!slug || !SLUG_PATTERN.test(slug)) { setCatError('slug는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'); return }

    setCatSaving(true); setCatError('')
    const fields = { name: catName.trim(), slug, sortOrder: Number(catSortOrder) || 0 }
    const result = catEditId
      ? await updateAdminShopCategory(catEditId, fields)
      : await createAdminShopCategory(fields)
    setCatSaving(false)
    if (result.error) { setCatError(result.error); return }
    closeCatForm()
    load()
  }

  // ── 하위카테고리 관리 (펼쳐진 카테고리 안에서) ──────────────────────
  const [subFormOpenFor, setSubFormOpenFor] = useState<string | null>(null) // category id
  const [subEditId, setSubEditId] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [subSlug, setSubSlug] = useState('')
  const [subSortOrder, setSubSortOrder] = useState('0')
  const [subSaving, setSubSaving] = useState(false)
  const [subError, setSubError] = useState('')

  function openCreateSub(categoryId: string) {
    setSubFormOpenFor(categoryId); setSubEditId(null)
    setSubName(''); setSubSlug(''); setSubSortOrder('0'); setSubError('')
  }
  function openEditSub(s: ShopSubcategory) {
    setSubFormOpenFor(s.category_id); setSubEditId(s.id)
    setSubName(s.name); setSubSlug(s.slug); setSubSortOrder(String(s.sort_order)); setSubError('')
  }
  function closeSubForm() { setSubFormOpenFor(null); setSubEditId(null) }

  async function submitSubForm(e: React.FormEvent) {
    e.preventDefault()
    if (!subFormOpenFor) return
    const slug = subSlug.trim()
    if (!subName.trim()) { setSubError('이름을 입력해주세요.'); return }
    if (!slug || !SLUG_PATTERN.test(slug)) { setSubError('slug는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'); return }

    setSubSaving(true); setSubError('')
    const fields = { categoryId: subFormOpenFor, name: subName.trim(), slug, sortOrder: Number(subSortOrder) || 0 }
    const result = subEditId
      ? await updateAdminShopSubcategory(subEditId, fields)
      : await createAdminShopSubcategory(fields)
    setSubSaving(false)
    if (result.error) { setSubError(result.error); return }
    closeSubForm()
    load()
  }

  // ── 상품 목록 필터 ──────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL)
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>(ALL)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [listQuery, setListQuery] = useState('')

  function handleCategoryFilterChange(value: string) {
    setCategoryFilter(value)
    setSubcategoryFilter(ALL)
  }

  const searchFiltered = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.title.toLowerCase().includes(q))
  }, [products, listQuery])

  const byStatusOnly = useMemo(
    () => searchFiltered.filter((p) => matchesStatus(p, statusFilter)),
    [searchFiltered, statusFilter],
  )
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of byStatusOnly) {
      const key = p.shop_category_id ?? UNCATEGORIZED
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [byStatusOnly])

  const byCategoryOnly = useMemo(() => {
    if (categoryFilter === ALL) return searchFiltered
    if (categoryFilter === UNCATEGORIZED) return searchFiltered.filter((p) => !p.shop_category_id)
    return searchFiltered.filter((p) => p.shop_category_id === categoryFilter)
  }, [searchFiltered, categoryFilter])

  const subcategoriesOfSelected = useMemo(
    () => (categoryFilter !== ALL && categoryFilter !== UNCATEGORIZED
      ? subcategories.filter((s) => s.category_id === categoryFilter)
      : []),
    [subcategories, categoryFilter],
  )
  const subcategoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of byCategoryOnly) {
      if (!p.shop_subcategory_id) continue
      map.set(p.shop_subcategory_id, (map.get(p.shop_subcategory_id) ?? 0) + 1)
    }
    return map
  }, [byCategoryOnly])

  const bySubcategoryOnly = useMemo(() => {
    if (subcategoryFilter === ALL || subcategoriesOfSelected.length === 0) return byCategoryOnly
    return byCategoryOnly.filter((p) => p.shop_subcategory_id === subcategoryFilter)
  }, [byCategoryOnly, subcategoryFilter, subcategoriesOfSelected])

  const statusCounts = useMemo(() => ({
    all: bySubcategoryOnly.length,
    published: bySubcategoryOnly.filter((p) => p.is_active).length,
    unpublished: bySubcategoryOnly.filter((p) => !p.is_active).length,
  }), [bySubcategoryOnly])

  const filteredProducts = useMemo(
    () => bySubcategoryOnly.filter((p) => matchesStatus(p, statusFilter)),
    [bySubcategoryOnly, statusFilter],
  )

  const hasListFilter = categoryFilter !== ALL || subcategoryFilter !== ALL || statusFilter !== 'all' || listQuery.trim() !== ''

  function resetListFilters() {
    setCategoryFilter(ALL); setSubcategoryFilter(ALL); setStatusFilter('all'); setListQuery('')
  }

  // ── 상품 등록/수정 폼 ────────────────────────────────────────────
  const [showProductForm, setShowProductForm] = useState(false)
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>('create')
  const [productEditId, setProductEditId] = useState<string | null>(null)
  const [pTitle, setPTitle] = useState('')
  const [pPriceText, setPPriceText] = useState('')
  const [pImageUrl, setPImageUrl] = useState('')
  const [pLinkUrl, setPLinkUrl] = useState('')
  const [pTagsInput, setPTagsInput] = useState('')
  const [pSortOrder, setPSortOrder] = useState('0')
  const [pIsActive, setPIsActive] = useState(true)
  const [pCategoryId, setPCategoryId] = useState('')
  const [pSubcategoryId, setPSubcategoryId] = useState('')
  const [pSaving, setPSaving] = useState(false)
  const [pError, setPError] = useState('')

  const subcategoriesForForm = useMemo(
    () => subcategories.filter((s) => s.category_id === pCategoryId),
    [subcategories, pCategoryId],
  )

  function resetProductForm() {
    setPTitle(''); setPPriceText(''); setPImageUrl(''); setPLinkUrl('')
    setPTagsInput(''); setPSortOrder('0'); setPIsActive(true)
    setPCategoryId(''); setPSubcategoryId('')
    setPError('')
  }
  function openCreateProduct() {
    setProductFormMode('create'); setProductEditId(null); resetProductForm(); setShowProductForm(true)
  }
  async function openEditProduct(id: string) {
    setPError('')
    setShowProductForm(true)
    setProductFormMode('edit')
    setProductEditId(id)
    setPTitle('로딩 중...')
    const product = await getAdminAffiliateProductById(id) as {
      title: string; price_text: string | null; image_url: string | null; link_url: string
      tags: string[] | null; sort_order: number; is_active: boolean
      shop_category_id: string | null; shop_subcategory_id: string | null
    } | null
    if (!product) { setPError('상품을 불러올 수 없습니다.'); return }
    setPTitle(product.title)
    setPPriceText(product.price_text ?? '')
    setPImageUrl(product.image_url ?? '')
    setPLinkUrl(product.link_url)
    setPTagsInput((product.tags ?? []).join(', '))
    setPSortOrder(String(product.sort_order))
    setPIsActive(product.is_active)
    setPCategoryId(product.shop_category_id ?? '')
    setPSubcategoryId(product.shop_subcategory_id ?? '')
  }
  function closeProductForm() { setShowProductForm(false); setProductEditId(null); resetProductForm() }

  function handleFormCategoryChange(value: string) {
    setPCategoryId(value)
    if (!subcategories.some((s) => s.id === pSubcategoryId && s.category_id === value)) setPSubcategoryId('')
  }

  async function submitProductForm(e: React.FormEvent) {
    e.preventDefault()
    if (!pTitle.trim()) { setPError('상품명을 입력해주세요.'); return }
    if (!pLinkUrl.trim()) { setPError('링크(URL)를 입력해주세요.'); return }

    const fields: AdminAffiliateFields = {
      title: pTitle.trim(),
      priceText: pPriceText.trim() || null,
      imageUrl: pImageUrl.trim() || null,
      linkUrl: pLinkUrl.trim(),
      tags: pTagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      sortOrder: Number(pSortOrder) || 0,
      isActive: pIsActive,
      shopCategoryId: pCategoryId || null,
      shopSubcategoryId: pSubcategoryId || null,
    }

    setPSaving(true); setPError('')
    const result = productFormMode === 'edit' && productEditId
      ? await updateAdminAffiliateProduct(productEditId, fields)
      : await createAdminAffiliateProduct(fields)
    setPSaving(false)
    if (result.error) { setPError(result.error); return }
    closeProductForm()
    load()
  }

  async function toggleProductActive(p: ShopProduct) {
    await updateAdminAffiliateProduct(p.id, {
      title: p.title,
      priceText: p.price_text,
      imageUrl: p.image_url,
      linkUrl: p.link_url,
      tags: p.tags ?? [],
      sortOrder: p.sort_order,
      isActive: !p.is_active,
      shopCategoryId: p.shop_category_id,
      shopSubcategoryId: p.shop_subcategory_id,
    })
    load()
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-xl font-bold text-brand-ink sm:text-2xl">상품관리</h1>
      </div>

      {/* ── 카테고리 관리 ── */}
      <div className="mb-8 rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-brand-ink">카테고리 관리 ({categories.length}개)</h2>
          <button
            onClick={catFormOpen ? closeCatForm : openCreateCat}
            className="rounded bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90"
          >
            {catFormOpen ? '취소' : '+ 카테고리 추가'}
          </button>
        </div>

        {catFormOpen && (
          <form onSubmit={submitCatForm} className="space-y-3 border-b border-gray-100 bg-gray-50 p-6">
            <p className="text-sm font-semibold text-brand-ink">{catEditId ? '카테고리 수정' : '새 카테고리'}</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1" style={{ minWidth: 160 }}>
                <label className="mb-1 block text-xs text-[#555]">이름</label>
                <input
                  type="text" value={catName} onChange={(e) => setCatName(e.target.value)}
                  placeholder="예: 여성패션"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
                />
              </div>
              <div className="flex-1" style={{ minWidth: 160 }}>
                <label className="mb-1 block text-xs text-[#555]">slug</label>
                <input
                  type="text" value={catSlug} onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="예: women-fashion"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
                />
              </div>
              <div style={{ width: 120 }}>
                <label className="mb-1 block text-xs text-[#555]">정렬 순서</label>
                <input
                  type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(e.target.value)}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
                />
              </div>
            </div>
            {catError && <p className="text-xs text-red-500">{catError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={catSaving}
                className="rounded bg-brand-ink px-4 py-1.5 text-xs font-semibold text-white hover:brightness-90 disabled:opacity-60">
                {catSaving ? '저장 중...' : catEditId ? '수정 완료' : '등록'}
              </button>
              <button type="button" onClick={closeCatForm}
                className="rounded border border-gray-300 px-4 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">등록된 카테고리가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((c) => {
              const subs = subcategories.filter((s) => s.category_id === c.id)
              const isExpanded = expandedCatId === c.id
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between gap-3 px-6 py-3">
                    <button
                      onClick={() => setExpandedCatId(isExpanded ? null : c.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="truncate text-sm font-medium text-[#333]">{c.name}</span>
                      <span className="shrink-0 text-xs text-gray-400">하위 {subs.length}개</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-3">
                      <button onClick={() => openEditCat(c)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'category', id: c.id, label: c.name })}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50 px-6 py-3 pl-12">
                      {subFormOpenFor === c.id && (
                        <form onSubmit={submitSubForm} className="mb-3 space-y-2 rounded border border-gray-200 bg-white p-4">
                          <p className="text-xs font-semibold text-brand-ink">{subEditId ? '하위카테고리 수정' : '새 하위카테고리'}</p>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text" value={subName} onChange={(e) => setSubName(e.target.value)}
                              placeholder="이름 (예: 원피스)"
                              className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-violet"
                              style={{ minWidth: 120 }}
                            />
                            <input
                              type="text" value={subSlug} onChange={(e) => setSubSlug(e.target.value)}
                              placeholder="slug (예: dress)"
                              className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-violet"
                              style={{ minWidth: 120 }}
                            />
                            <input
                              type="number" value={subSortOrder} onChange={(e) => setSubSortOrder(e.target.value)}
                              className="w-20 rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-violet"
                            />
                          </div>
                          {subError && <p className="text-xs text-red-500">{subError}</p>}
                          <div className="flex gap-2">
                            <button type="submit" disabled={subSaving}
                              className="rounded bg-brand-ink px-3 py-1 text-xs font-semibold text-white hover:brightness-90 disabled:opacity-60">
                              {subSaving ? '저장 중...' : subEditId ? '수정 완료' : '등록'}
                            </button>
                            <button type="button" onClick={closeSubForm}
                              className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50">
                              취소
                            </button>
                          </div>
                        </form>
                      )}

                      {subs.length === 0 ? (
                        <p className="text-xs text-gray-400">하위카테고리가 없습니다.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {subs.map((s) => (
                            <div key={s.id} className="flex items-center justify-between gap-3 rounded border border-gray-100 bg-white px-3 py-1.5">
                              <span className="truncate text-xs text-[#555]">{s.name}</span>
                              <div className="flex shrink-0 items-center gap-2">
                                <button onClick={() => openEditSub(s)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                                <button
                                  onClick={() => setDeleteTarget({ type: 'subcategory', id: s.id, label: s.name })}
                                  className="text-xs text-red-400 hover:text-red-600"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {subFormOpenFor !== c.id && (
                        <button
                          onClick={() => openCreateSub(c.id)}
                          className="mt-3 rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50"
                        >
                          + 하위카테고리 추가
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 상품 등록/수정 폼 ── */}
      {showProductForm && (
        <form onSubmit={submitProductForm} className="mb-8 max-w-2xl space-y-4 rounded border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-brand-ink">
            {productFormMode === 'edit' ? '상품 수정' : '새 상품 등록'}
          </h2>

          <div>
            <label className="mb-1 block text-sm text-[#555]">상품명</label>
            <input
              type="text" value={pTitle} onChange={(e) => setPTitle(e.target.value)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">가격 텍스트 (선택)</label>
            <input
              type="text" value={pPriceText} onChange={(e) => setPPriceText(e.target.value)}
              placeholder="예: 12,900원"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">이미지 URL (선택)</label>
            <div className="flex items-center gap-3">
              <input
                type="text" value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
              <ImageThumbnail key={pImageUrl} src={pImageUrl.trim() || null} alt="미리보기" className="h-14 w-14 shrink-0 rounded object-cover" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">
              링크 URL <span className="text-xs text-gray-400">(쿠팡 파트너스 등에서 발급받은 링크를 직접 입력하세요)</span>
            </label>
            <input
              type="text" value={pLinkUrl} onChange={(e) => setPLinkUrl(e.target.value)}
              placeholder="https://link.coupang.com/..."
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-[#555]">카테고리</label>
              <select
                value={pCategoryId} onChange={(e) => handleFormCategoryChange(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-violet"
              >
                <option value="">미분류</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-[#555]">하위카테고리</label>
              <select
                value={pSubcategoryId} onChange={(e) => setPSubcategoryId(e.target.value)}
                disabled={!pCategoryId}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-violet disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">선택 안 함</option>
                {subcategoriesForForm.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">태그 (쉼표로 구분, 사전 항목과 매칭됨)</label>
            <input
              type="text" value={pTagsInput} onChange={(e) => setPTagsInput(e.target.value)}
              placeholder="예: 돼지, 재물운"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">정렬 순서 (작을수록 먼저 노출)</label>
            <input
              type="number" value={pSortOrder} onChange={(e) => setPSortOrder(e.target.value)}
              className="w-32 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#555]">
            <input type="checkbox" checked={pIsActive} onChange={(e) => setPIsActive(e.target.checked)} className="accent-brand-ink" />
            공개 (체크 시 노출)
          </label>

          {pError && <p className="text-sm text-red-500">{pError}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={pSaving}
              className="rounded bg-brand-ink px-5 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
              {pSaving ? '저장 중...' : productFormMode === 'edit' ? '수정 완료' : '등록'}
            </button>
            <button type="button" onClick={closeProductForm}
              className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50">
              취소
            </button>
          </div>
        </form>
      )}

      {/* ── 상품 목록 ── */}
      <div className="rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-brand-ink">
              상품 목록 ({hasListFilter ? `${filteredProducts.length}개 / 전체 ${products.length}개` : `${products.length}개`})
            </h2>
            {!showProductForm && (
              <button
                onClick={openCreateProduct}
                className="rounded bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90"
              >
                + 상품 등록
              </button>
            )}
          </div>
          {loadError && <p className="mt-1 text-sm text-red-500">목록을 불러오지 못했습니다: {loadError}</p>}

          {products.length > 0 && (
            <>
              {/* 카테고리 탭 */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button" onClick={() => handleCategoryFilterChange(ALL)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    categoryFilter === ALL ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                  }`}
                >
                  전체 ({byStatusOnly.length})
                </button>
                <button
                  type="button" onClick={() => handleCategoryFilterChange(UNCATEGORIZED)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    categoryFilter === UNCATEGORIZED ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                  }`}
                >
                  미분류 ({categoryCounts.get(UNCATEGORIZED) ?? 0})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id} type="button" onClick={() => handleCategoryFilterChange(c.id)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      categoryFilter === c.id ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                    }`}
                  >
                    {c.name} ({categoryCounts.get(c.id) ?? 0})
                  </button>
                ))}
              </div>

              {/* 하위카테고리 탭 (카테고리 선택 시) */}
              {subcategoriesOfSelected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-4">
                  <button
                    type="button" onClick={() => setSubcategoryFilter(ALL)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                      subcategoryFilter === ALL ? 'bg-brand-violet text-white' : 'border border-gray-200 text-[#777] hover:border-brand-violet hover:text-brand-violet'
                    }`}
                  >
                    전체
                  </button>
                  {subcategoriesOfSelected.map((s) => (
                    <button
                      key={s.id} type="button" onClick={() => setSubcategoryFilter(s.id)}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        subcategoryFilter === s.id ? 'bg-brand-violet text-white' : 'border border-gray-200 text-[#777] hover:border-brand-violet hover:text-brand-violet'
                      }`}
                    >
                      {s.name} ({subcategoryCounts.get(s.id) ?? 0})
                    </button>
                  ))}
                </div>
              )}

              {/* 발행상태 + 검색 */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button" onClick={() => setStatusFilter('all')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === 'all' ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                  }`}
                >
                  전체 ({statusCounts.all})
                </button>
                <button
                  type="button" onClick={() => setStatusFilter('unpublished')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === 'unpublished' ? 'bg-amber-500 text-white' : 'border border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500'
                  }`}
                >
                  비공개 ({statusCounts.unpublished})
                </button>
                <button
                  type="button" onClick={() => setStatusFilter('published')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === 'published' ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                  }`}
                >
                  공개 ({statusCounts.published})
                </button>

                <input
                  type="text" value={listQuery} onChange={(e) => setListQuery(e.target.value)}
                  placeholder="상품명 검색"
                  className="ml-auto w-48 rounded border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-brand-violet"
                />
              </div>
            </>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {loadError ? '오류로 목록을 표시할 수 없습니다.' : '등록된 상품이 없습니다.'}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-gray-400">조건에 맞는 상품이 없습니다.</p>
            <button
              type="button" onClick={resetListFilters}
              className="rounded border border-gray-300 px-4 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                  <th className="px-6 py-3">썸네일</th>
                  <th className="px-6 py-3">상품명</th>
                  <th className="px-6 py-3">가격</th>
                  <th className="px-6 py-3">카테고리</th>
                  <th className="px-6 py-3">발행상태</th>
                  <th className="px-6 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const catName = categoryName(p.shop_category_id)
                  const subName = subcategoryName(p.shop_subcategory_id)
                  return (
                    <tr key={p.id}>
                      <td className="px-6 py-3">
                        <ImageThumbnail src={p.image_url} alt={p.title} className="h-14 w-14 rounded object-cover" />
                      </td>
                      <td className="max-w-xs px-6 py-3 font-medium text-[#333]">
                        <span className="line-clamp-2">{p.title}</span>
                      </td>
                      <td className="px-6 py-3 text-[#777]">{p.price_text ?? '-'}</td>
                      <td className="px-6 py-3 text-[#777]">
                        {catName ? `${catName}${subName ? ` > ${subName}` : ''}` : <span className="text-gray-300">미분류</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? '공개' : '비공개'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleProductActive(p)} className="text-xs text-amber-600 hover:text-amber-800">
                            {p.is_active ? '비공개로' : '공개로'}
                          </button>
                          <button onClick={() => openEditProduct(p.id)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'product', id: p.id, label: p.title })}
                            className="text-xs text-red-400 hover:text-red-600"
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
        )}
      </div>

      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-brand-ink">
              {deleteTarget.type === 'category' ? '카테고리 삭제' : deleteTarget.type === 'subcategory' ? '하위카테고리 삭제' : '상품 삭제'}
            </h3>
            <p className="mb-6 text-center text-sm text-[#555]">
              &ldquo;{deleteTarget.label}&rdquo;{deleteTarget.type !== 'product' ? '을(를) 삭제하면 소속된 하위 항목·상품 연결이 영향을 받을 수 있습니다.' : '을(를) 삭제하시겠습니까?'}
              <br />삭제 후 복구할 수 없습니다.
            </p>
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
