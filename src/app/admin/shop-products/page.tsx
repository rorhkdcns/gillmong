'use client'

import { Fragment, useState, useEffect, useMemo } from 'react'
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

const UNCATEGORIZED = '__uncategorized__'
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function matchesStatus(p: ShopProduct, filter: StatusFilter): boolean {
  if (filter === 'published') return p.is_active
  if (filter === 'unpublished') return !p.is_active
  return true
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
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

  // ── 드릴다운(아코디언) 상태 ───────────────────────────────────────
  // 1단계: 카테고리 표에서 한 번에 하나만 펼침(expandedKey). 2단계: 그 안에서
  // 하위카테고리를 골라 상품 목록을 좁힘(selectedSubcategoryId, null이면 카테고리 전체).
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [listQuery, setListQuery] = useState('')

  function toggleExpand(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key))
    setSelectedSubcategoryId(null)
    setStatusFilter('all')
    setListQuery('')
  }

  function toggleSubcategory(id: string) {
    setSelectedSubcategoryId((prev) => (prev === id ? null : id))
  }

  // 카테고리가 삭제되는 등으로 사라졌는데 그 화면이 펼쳐진 채로 남아있지 않도록 정리.
  useEffect(() => {
    if (!expandedKey || expandedKey === UNCATEGORIZED) return
    if (!categories.some((c) => c.id === expandedKey)) {
      setExpandedKey(null)
      setSelectedSubcategoryId(null)
    }
  }, [categories, expandedKey])

  // ── 카테고리별 집계 ──────────────────────────────────────────────
  function subcategoriesOf(categoryId: string) {
    return subcategories.filter((s) => s.category_id === categoryId)
  }
  function productsOfCategory(categoryId: string) {
    return products.filter((p) => p.shop_category_id === categoryId)
  }
  function productsOfSubcategory(subcategoryId: string) {
    return products.filter((p) => p.shop_subcategory_id === subcategoryId)
  }
  const uncategorizedProducts = useMemo(() => products.filter((p) => !p.shop_category_id), [products])

  // 현재 펼쳐진 패널(카테고리 전체 또는 선택된 하위카테고리)에 해당하는 상품 — 검색/상태 필터 적용 전.
  const scopedProducts = useMemo(() => {
    if (expandedKey === null) return []
    if (expandedKey === UNCATEGORIZED) return uncategorizedProducts
    if (selectedSubcategoryId) return productsOfSubcategory(selectedSubcategoryId)
    return productsOfCategory(expandedKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedKey, selectedSubcategoryId, products, uncategorizedProducts])

  const scopedFiltered = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    return scopedProducts.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false
      return matchesStatus(p, statusFilter)
    })
  }, [scopedProducts, listQuery, statusFilter])

  const scopedStatusCounts = useMemo(() => {
    const bySearch = listQuery.trim()
      ? scopedProducts.filter((p) => p.title.toLowerCase().includes(listQuery.trim().toLowerCase()))
      : scopedProducts
    return {
      all: bySearch.length,
      published: bySearch.filter((p) => p.is_active).length,
      unpublished: bySearch.filter((p) => !p.is_active).length,
    }
  }, [scopedProducts, listQuery])

  // ── 카테고리 등록/수정 모달 ───────────────────────────────────────
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catSortOrder, setCatSortOrder] = useState('0')
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState('')

  function openCreateCat() {
    setCatModalOpen(true); setCatEditId(null)
    setCatName(''); setCatSlug(''); setCatSortOrder('0'); setCatError('')
  }
  function openEditCat(c: ShopCategory) {
    setCatModalOpen(true); setCatEditId(c.id)
    setCatName(c.name); setCatSlug(c.slug); setCatSortOrder(String(c.sort_order)); setCatError('')
  }
  function closeCatModal() { setCatModalOpen(false); setCatEditId(null) }

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
    closeCatModal()
    load()
  }

  // ── 하위카테고리 등록/수정 모달 ────────────────────────────────────
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [subModalCategoryId, setSubModalCategoryId] = useState<string | null>(null)
  const [subEditId, setSubEditId] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [subSlug, setSubSlug] = useState('')
  const [subSortOrder, setSubSortOrder] = useState('0')
  const [subSaving, setSubSaving] = useState(false)
  const [subError, setSubError] = useState('')

  function openCreateSub(categoryId: string) {
    setSubModalOpen(true); setSubModalCategoryId(categoryId); setSubEditId(null)
    setSubName(''); setSubSlug(''); setSubSortOrder('0'); setSubError('')
  }
  function openEditSub(s: ShopSubcategory) {
    setSubModalOpen(true); setSubModalCategoryId(s.category_id); setSubEditId(s.id)
    setSubName(s.name); setSubSlug(s.slug); setSubSortOrder(String(s.sort_order)); setSubError('')
  }
  function closeSubModal() { setSubModalOpen(false); setSubModalCategoryId(null); setSubEditId(null) }

  async function submitSubForm(e: React.FormEvent) {
    e.preventDefault()
    if (!subModalCategoryId) return
    const slug = subSlug.trim()
    if (!subName.trim()) { setSubError('이름을 입력해주세요.'); return }
    if (!slug || !SLUG_PATTERN.test(slug)) { setSubError('slug는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'); return }

    setSubSaving(true); setSubError('')
    const fields = { categoryId: subModalCategoryId, name: subName.trim(), slug, sortOrder: Number(subSortOrder) || 0 }
    const result = subEditId
      ? await updateAdminShopSubcategory(subEditId, fields)
      : await createAdminShopSubcategory(fields)
    setSubSaving(false)
    if (result.error) { setSubError(result.error); return }
    closeSubModal()
    load()
  }

  // ── 상품 등록/수정 모달 ────────────────────────────────────────────
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
  // 지금 펼쳐서 보고 있는 카테고리/하위카테고리를 기본값으로 채워서 새 상품 등록.
  function openCreateProduct() {
    setProductFormMode('create'); setProductEditId(null); resetProductForm()
    if (expandedKey && expandedKey !== UNCATEGORIZED) {
      setPCategoryId(expandedKey)
      if (selectedSubcategoryId) setPSubcategoryId(selectedSubcategoryId)
    }
    setShowProductForm(true)
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

  // ── 펼쳐진 패널 안의 상품 목록(공용 블록) ────────────────────────────
  function renderProductListPanel(heading: string) {
    return (
      <div className="rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-brand-ink">
              {heading} ({scopedFiltered.length !== scopedProducts.length ? `${scopedFiltered.length}개 / 전체 ${scopedProducts.length}개` : `${scopedProducts.length}개`})
            </p>
            <button
              type="button" onClick={openCreateProduct}
              className="shrink-0 rounded bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90"
            >
              + 상품 등록
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button" onClick={() => setStatusFilter('all')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'all' ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              전체 ({scopedStatusCounts.all})
            </button>
            <button
              type="button" onClick={() => setStatusFilter('unpublished')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'unpublished' ? 'bg-amber-500 text-white' : 'border border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500'
              }`}
            >
              비공개 ({scopedStatusCounts.unpublished})
            </button>
            <button
              type="button" onClick={() => setStatusFilter('published')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'published' ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              공개 ({scopedStatusCounts.published})
            </button>
            <input
              type="text" value={listQuery} onChange={(e) => setListQuery(e.target.value)}
              placeholder="상품명 검색"
              className="ml-auto w-40 rounded border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-brand-violet"
            />
          </div>
        </div>

        {scopedProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">등록된 상품이 없습니다.</div>
        ) : scopedFiltered.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">조건에 맞는 상품이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                  <th className="px-4 py-2">이미지</th>
                  <th className="px-4 py-2">상품명</th>
                  <th className="px-4 py-2">가격</th>
                  <th className="px-4 py-2">발행상태</th>
                  <th className="px-4 py-2">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scopedFiltered.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      <ImageThumbnail src={p.image_url} alt={p.title} className="h-12 w-12 rounded object-cover" />
                    </td>
                    <td className="max-w-xs px-4 py-2 font-medium text-[#333]">
                      <span className="line-clamp-2">{p.title}</span>
                    </td>
                    <td className="px-4 py-2 text-[#777]">{p.price_text ?? '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-xl font-bold text-brand-ink sm:text-2xl">상품관리</h1>
      </div>

      {/* ── 카테고리 표(아코디언) ── */}
      <div className="rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-brand-ink">카테고리 ({categories.length}개)</h2>
          <button
            onClick={openCreateCat}
            className="rounded bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90"
          >
            + 카테고리 추가
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : loadError ? (
          <div className="py-12 text-center text-sm text-red-500">목록을 불러오지 못했습니다: {loadError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3">카테고리</th>
                  <th className="px-4 py-3">하위카테고리 수</th>
                  <th className="px-4 py-3">상품 수</th>
                  <th className="px-4 py-3">공개중</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => {
                  const subs = subcategoriesOf(c.id)
                  const catProducts = productsOfCategory(c.id)
                  const isExpanded = expandedKey === c.id
                  return (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => toggleExpand(c.id)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-brand-primary-light' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3"><ChevronIcon open={isExpanded} /></td>
                        <td className="px-4 py-3 font-medium text-[#333]">{c.name}</td>
                        <td className="px-4 py-3 text-[#777]">{subs.length}</td>
                        <td className="px-4 py-3 text-[#777]">{catProducts.length}</td>
                        <td className="px-4 py-3 text-[#777]">{catProducts.filter((p) => p.is_active).length}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEditCat(c)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'category', id: c.id, label: c.name })}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 p-4">
                            <div className="flex flex-col gap-4">
                              {/* 하위카테고리 표 */}
                              <div className="rounded border border-gray-200 bg-white">
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                                  <p className="text-xs font-semibold text-brand-ink">하위카테고리 ({subs.length}개)</p>
                                  <button
                                    type="button" onClick={() => openCreateSub(c.id)}
                                    className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50"
                                  >
                                    + 하위카테고리 추가
                                  </button>
                                </div>
                                {subs.length === 0 ? (
                                  <p className="px-4 py-3 text-xs text-gray-400">하위카테고리가 없습니다.</p>
                                ) : (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-100 text-left text-[#999]">
                                        <th className="px-4 py-2 font-normal">이름</th>
                                        <th className="px-4 py-2 font-normal">상품 수</th>
                                        <th className="px-4 py-2 font-normal">관리</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {subs.map((s) => {
                                        const subSelected = selectedSubcategoryId === s.id
                                        return (
                                          <tr
                                            key={s.id}
                                            onClick={() => toggleSubcategory(s.id)}
                                            className={`cursor-pointer transition-colors ${subSelected ? 'bg-brand-primary-light' : 'hover:bg-gray-50'}`}
                                          >
                                            <td className="px-4 py-2 font-medium text-[#333]">{s.name}</td>
                                            <td className="px-4 py-2 text-[#777]">{productsOfSubcategory(s.id).length}개</td>
                                            <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                              <div className="flex items-center gap-2.5">
                                                <button onClick={() => openEditSub(s)} className="text-blue-500 hover:text-blue-700">수정</button>
                                                <button
                                                  onClick={() => setDeleteTarget({ type: 'subcategory', id: s.id, label: s.name })}
                                                  className="text-red-400 hover:text-red-600"
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
                                )}
                              </div>

                              {/* 상품 목록: 하위카테고리 선택 시 그 하위카테고리만, 아니면 카테고리 전체 */}
                              {renderProductListPanel(
                                selectedSubcategoryId
                                  ? `${subcategories.find((s) => s.id === selectedSubcategoryId)?.name ?? ''} 상품`
                                  : `${c.name} 전체 상품`,
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}

                {/* 미분류 */}
                <Fragment>
                  <tr
                    onClick={() => toggleExpand(UNCATEGORIZED)}
                    className={`cursor-pointer transition-colors ${expandedKey === UNCATEGORIZED ? 'bg-brand-primary-light' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3"><ChevronIcon open={expandedKey === UNCATEGORIZED} /></td>
                    <td className="px-4 py-3 font-medium text-[#333]">미분류</td>
                    <td className="px-4 py-3 text-gray-300">-</td>
                    <td className="px-4 py-3 text-[#777]">{uncategorizedProducts.length}</td>
                    <td className="px-4 py-3 text-[#777]">{uncategorizedProducts.filter((p) => p.is_active).length}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                  {expandedKey === UNCATEGORIZED && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 p-4">
                        {renderProductListPanel('미분류 상품')}
                      </td>
                    </tr>
                  )}
                </Fragment>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 카테고리 등록/수정 모달 ── */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={submitCatForm} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-brand-ink">{catEditId ? '카테고리 수정' : '새 카테고리'}</h3>
            <div>
              <label className="mb-1 block text-xs text-[#555]">이름</label>
              <input
                type="text" value={catName} onChange={(e) => setCatName(e.target.value)}
                placeholder="예: 여성패션"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#555]">slug</label>
              <input
                type="text" value={catSlug} onChange={(e) => setCatSlug(e.target.value)}
                placeholder="예: women-fashion"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#555]">정렬 순서</label>
              <input
                type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(e.target.value)}
                className="w-32 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
            </div>
            {catError && <p className="text-xs text-red-500">{catError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={catSaving}
                className="flex-1 rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
                {catSaving ? '저장 중...' : catEditId ? '수정 완료' : '등록'}
              </button>
              <button type="button" onClick={closeCatModal}
                className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 하위카테고리 등록/수정 모달 ── */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={submitSubForm} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-brand-ink">{subEditId ? '하위카테고리 수정' : '새 하위카테고리'}</h3>
            <div>
              <label className="mb-1 block text-xs text-[#555]">이름</label>
              <input
                type="text" value={subName} onChange={(e) => setSubName(e.target.value)}
                placeholder="예: 원피스"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#555]">slug</label>
              <input
                type="text" value={subSlug} onChange={(e) => setSubSlug(e.target.value)}
                placeholder="예: dress"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#555]">정렬 순서</label>
              <input
                type="number" value={subSortOrder} onChange={(e) => setSubSortOrder(e.target.value)}
                className="w-32 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
            </div>
            {subError && <p className="text-xs text-red-500">{subError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={subSaving}
                className="flex-1 rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
                {subSaving ? '저장 중...' : subEditId ? '수정 완료' : '등록'}
              </button>
              <button type="button" onClick={closeSubModal}
                className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 상품 등록/수정 모달 ── */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <form
            onSubmit={submitProductForm}
            className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-brand-ink">
              {productFormMode === 'edit' ? '상품 수정' : '새 상품 등록'}
            </h3>

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
                className="flex-1 rounded bg-brand-ink px-5 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
                {pSaving ? '저장 중...' : productFormMode === 'edit' ? '수정 완료' : '등록'}
              </button>
              <button type="button" onClick={closeProductForm}
                className="flex-1 rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
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
