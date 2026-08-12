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
  reactivateAdminAffiliateProduct,
  bulkUpdateAdminProductCategory,
  bulkUpdateAdminProductActive,
  bulkReactivateAdminProducts,
  bulkAddAdminProductTags,
  bulkDeleteAdminProducts,
  generateShopProducts,
  type AdminAffiliateFields,
} from '../actions'
import ImageThumbnail from '@/components/ImageThumbnail'
import { suggestTagsFromTitle } from '@/lib/autoTagProduct'

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
  click_count: number
  impression_count: number
  last_checked_at: string | null
  deactivated_reason: string | null
  deactivated_at: string | null
}

type StatusFilter = 'all' | 'published' | 'unpublished'
type ActiveFilter = 'all' | 'active' | 'inactive'
type DeleteTarget = { type: 'category' | 'subcategory' | 'product'; id: string; label: string }
type ProductFormTab = 'manual' | 'coupang'

const UNCATEGORIZED = '__uncategorized__'
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const STALE_DAYS = 30
const MIN_TAG_COUNT = 3
const PAGE_SIZE = 20
const NO_PERFORMANCE_MIN_IMPRESSIONS = 20

interface CoupangProduct {
  productId: number
  productName: string
  productPrice: number
  productImage: string
  productUrl: string
  isRocket: boolean
  isFreeShipping: boolean
}

function matchesStatus(p: ShopProduct, filter: StatusFilter): boolean {
  if (filter === 'published') return p.is_active
  if (filter === 'unpublished') return !p.is_active
  return true
}

function isStale(lastCheckedAt: string | null): boolean {
  if (!lastCheckedAt) return true
  const diffDays = (Date.now() - new Date(lastCheckedAt).getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= STALE_DAYS
}

function ctrLabel(clickCount: number, impressionCount: number): string {
  if (!impressionCount) return '-'
  return `${((clickCount / impressionCount) * 100).toFixed(1)}%`
}

function hasNoPerformance(p: Pick<ShopProduct, 'click_count' | 'impression_count'>): boolean {
  return p.impression_count >= NO_PERFORMANCE_MIN_IMPRESSIONS && p.click_count === 0
}

/** "10,900원" 같은 텍스트에서 숫자만 뽑아낸다. 파싱 실패(빈 값·숫자 없음) 시 null. */
function parsePriceNumber(priceText: string | null): number | null {
  if (!priceText) return null
  const digits = priceText.replace(/[^0-9]/g, '')
  if (!digits) return null
  const n = parseInt(digits, 10)
  return Number.isNaN(n) ? null : n
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
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())

  function markImageBroken(id: string) {
    setBrokenImageIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }

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

  function categoryLabel(p: ShopProduct): string {
    if (!p.shop_category_id) return '미분류'
    const cat = categories.find((c) => c.id === p.shop_category_id)
    if (!cat) return '미분류'
    if (!p.shop_subcategory_id) return cat.name
    const sub = subcategories.find((s) => s.id === p.shop_subcategory_id)
    return sub ? `${cat.name} > ${sub.name}` : cat.name
  }

  // ── 통합 삭제 확인 모달(단일) ───────────────────────────────────────
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

  async function handleReactivate(id: string) {
    await reactivateAdminAffiliateProduct(id)
    load()
  }

  // ── 카테고리/하위카테고리 행의 "상품생성" 버튼 (구 collect_shop_products.py 대체) ──
  const [generatingKey, setGeneratingKey] = useState<string | null>(null)
  const [generateResult, setGenerateResult] = useState<Record<string, { ok: boolean; text: string }>>({})

  async function handleGenerateProducts(categoryId: string, subcategoryId: string | undefined, rowKey: string) {
    setGeneratingKey(rowKey)
    setGenerateResult((prev) => {
      if (!(rowKey in prev)) return prev
      const next = { ...prev }; delete next[rowKey]; return next
    })
    const result = await generateShopProducts(categoryId, subcategoryId)
    setGeneratingKey(null)
    if (result.error) {
      setGenerateResult((prev) => ({ ...prev, [rowKey]: { ok: false, text: result.error! } }))
      return
    }
    const skipNote = result.skipCount ? ` (중복 ${result.skipCount}개 건너뜀)` : ''
    setGenerateResult((prev) => ({ ...prev, [rowKey]: { ok: true, text: `신규 ${result.newCount ?? 0}개 저장됨${skipNote}` } }))
    load()
  }

  // ── 상품 체크박스 선택 + 일괄 작업 (카테고리별 패널·전체 상품 목록 공용) ───────
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [bulkActing, setBulkActing] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkSubcategoryId, setBulkSubcategoryId] = useState('')
  const [bulkTagAddInput, setBulkTagAddInput] = useState('')

  function toggleProductSelect(id: string) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedProductIds(new Set())
    setBulkCategoryId('')
    setBulkSubcategoryId('')
    setBulkTagAddInput('')
    setBulkError('')
  }

  const bulkSubcategoryOptions = useMemo(
    () => subcategories.filter((s) => s.category_id === bulkCategoryId),
    [subcategories, bulkCategoryId],
  )

  async function applyBulkCategory() {
    if (selectedProductIds.size === 0) return
    setBulkActing(true); setBulkError('')
    const result = await bulkUpdateAdminProductCategory(
      Array.from(selectedProductIds), bulkCategoryId || null, bulkSubcategoryId || null,
    )
    setBulkActing(false)
    if (result.error) { setBulkError(result.error); return }
    clearSelection()
    load()
  }

  async function applyBulkActive(isActive: boolean) {
    if (selectedProductIds.size === 0) return
    setBulkActing(true); setBulkError('')
    const result = await bulkUpdateAdminProductActive(Array.from(selectedProductIds), isActive)
    setBulkActing(false)
    if (result.error) { setBulkError(result.error); return }
    clearSelection()
    load()
  }

  // "확인 필요" 목록 전용 — deactivated_reason/deactivated_at도 함께 지운다.
  async function applyBulkReactivate() {
    if (selectedProductIds.size === 0) return
    setBulkActing(true); setBulkError('')
    const result = await bulkReactivateAdminProducts(Array.from(selectedProductIds))
    setBulkActing(false)
    if (result.error) { setBulkError(result.error); return }
    clearSelection()
    load()
  }

  async function applyBulkAddTags() {
    const tags = bulkTagAddInput.split(',').map((t) => t.trim()).filter(Boolean)
    if (selectedProductIds.size === 0 || tags.length === 0) return
    setBulkActing(true); setBulkError('')
    const result = await bulkAddAdminProductTags(Array.from(selectedProductIds), tags)
    setBulkActing(false)
    if (result.error) { setBulkError(result.error); return }
    clearSelection()
    load()
  }

  async function confirmBulkDelete() {
    setBulkActing(true); setBulkError('')
    const result = await bulkDeleteAdminProducts(Array.from(selectedProductIds))
    setBulkActing(false)
    setBulkDeleteConfirm(false)
    if (result.error) { setBulkError(result.error); return }
    clearSelection()
    load()
  }

  function renderBulkToolbar() {
    if (selectedProductIds.size === 0) return null
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-brand-primary-light/40 px-4 py-3">
        <span className="shrink-0 text-xs font-semibold text-brand-ink">{selectedProductIds.size}개 선택됨</span>

        <div className="flex items-center gap-1.5">
          <select
            value={bulkCategoryId}
            onChange={(e) => { setBulkCategoryId(e.target.value); setBulkSubcategoryId('') }}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-violet"
          >
            <option value="">미분류</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={bulkSubcategoryId}
            onChange={(e) => setBulkSubcategoryId(e.target.value)}
            disabled={!bulkCategoryId}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-violet disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">선택 안 함</option>
            {bulkSubcategoryOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="button" onClick={applyBulkCategory} disabled={bulkActing}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-50">
            카테고리 적용
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => applyBulkActive(true)} disabled={bulkActing}
            className="rounded border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
            공개로 전환
          </button>
          <button type="button" onClick={() => applyBulkActive(false)} disabled={bulkActing}
            className="rounded border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50">
            비공개로 전환
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text" value={bulkTagAddInput} onChange={(e) => setBulkTagAddInput(e.target.value)}
            placeholder="추가할 태그 (쉼표 구분)"
            className="w-36 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-violet"
          />
          <button type="button" onClick={applyBulkAddTags} disabled={bulkActing || !bulkTagAddInput.trim()}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-50">
            태그 추가
          </button>
        </div>

        <button type="button" onClick={() => setBulkDeleteConfirm(true)} disabled={bulkActing}
          className="ml-auto rounded border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
          일괄 삭제
        </button>
        <button type="button" onClick={clearSelection}
          className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50">
          선택 해제
        </button>

        {bulkError && <p className="w-full text-xs text-red-500">{bulkError}</p>}
      </div>
    )
  }

  // ── 드릴다운(아코디언) 상태 ───────────────────────────────────────
  // 1단계: 카테고리 표에서 한 번에 하나만 펼침(expandedKey). 2단계: 그 안에서
  // 하위카테고리를 골라 상품 목록을 좁힘(selectedSubcategoryId, null이면 카테고리 전체).
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [listQuery, setListQuery] = useState('')
  const [scopedPage, setScopedPage] = useState(1)

  function toggleExpand(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key))
    setSelectedSubcategoryId(null)
    setStatusFilter('all')
    setListQuery('')
    setScopedPage(1)
  }

  function toggleSubcategory(id: string) {
    setSelectedSubcategoryId((prev) => (prev === id ? null : id))
    setScopedPage(1)
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

  const scopedTotalPages = Math.max(1, Math.ceil(scopedFiltered.length / PAGE_SIZE))
  const scopedCurrentPage = Math.min(scopedPage, scopedTotalPages)
  const scopedPaged = scopedFiltered.slice((scopedCurrentPage - 1) * PAGE_SIZE, scopedCurrentPage * PAGE_SIZE)

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

  // ── 상품 등록/수정 모달 (직접 입력 / 쿠팡 검색) ─────────────────────
  const [showProductForm, setShowProductForm] = useState(false)
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>('create')
  const [productEditId, setProductEditId] = useState<string | null>(null)
  const [pFormTab, setPFormTab] = useState<ProductFormTab>('manual')
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

  // ── 쿠팡에서 검색 (상품 등록 모달의 "쿠팡에서 검색" 탭) ───────────────
  const [coupangKeyword, setCoupangKeyword] = useState('')
  const [coupangResults, setCoupangResults] = useState<CoupangProduct[]>([])
  const [coupangSearching, setCoupangSearching] = useState(false)
  const [coupangError, setCoupangError] = useState('')
  const [coupangSaveMsg, setCoupangSaveMsg] = useState('')
  const [selectedCoupangIds, setSelectedCoupangIds] = useState<Set<number>>(new Set())
  const [coupangTags, setCoupangTags] = useState<Record<number, string>>({})
  const [coupangSaving, setCoupangSaving] = useState(false)
  const [bulkTagInput, setBulkTagInput] = useState('')

  async function handleCoupangSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!coupangKeyword.trim()) { setCoupangError('검색어를 입력해주세요.'); return }

    setCoupangSearching(true)
    setCoupangError('')
    setCoupangSaveMsg('')
    try {
      const res = await fetch('/api/admin/coupang/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: coupangKeyword.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '검색에 실패했습니다.')
      const results: CoupangProduct[] = data.products ?? []
      setCoupangResults(results)
      setSelectedCoupangIds(new Set())
      // 상품명 기준 추천 태그로 미리 채워두되(등록 전 자유롭게 수정 가능), 추천이 없는 상품은 빈 칸으로 둔다.
      const suggestedTags: Record<number, string> = {}
      for (const p of results) {
        const suggested = suggestTagsFromTitle(p.productName)
        if (suggested.length > 0) suggestedTags[p.productId] = suggested.join(', ')
      }
      setCoupangTags(suggestedTags)
      setBulkTagInput('')
    } catch (err) {
      setCoupangError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
      setCoupangResults([])
    } finally {
      setCoupangSearching(false)
    }
  }

  function toggleCoupangSelect(productId: number) {
    setSelectedCoupangIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const allCoupangSelected = coupangResults.length > 0 && selectedCoupangIds.size === coupangResults.length

  function toggleSelectAllCoupang() {
    setSelectedCoupangIds(allCoupangSelected ? new Set() : new Set(coupangResults.map((p) => p.productId)))
  }

  function handleBulkTagChange(value: string) {
    setBulkTagInput(value)
    setCoupangTags((prev) => {
      const next = { ...prev }
      for (const id of selectedCoupangIds) next[id] = value
      return next
    })
  }

  async function handleCoupangSave() {
    const items = coupangResults
      .filter((p) => selectedCoupangIds.has(p.productId))
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        productPrice: p.productPrice,
        productImage: p.productImage,
        productUrl: p.productUrl,
        tags: (coupangTags[p.productId] ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      }))
    if (items.length === 0) { setCoupangError('저장할 상품을 선택해주세요.'); return }
    if (items.some((item) => item.tags.length === 0)) {
      setCoupangError('태그가 없는 상품이 있습니다. 선택한 모든 상품에 태그를 입력해주세요. (태그가 없으면 사전 페이지에 노출되지 않습니다)')
      return
    }

    setCoupangSaving(true)
    setCoupangError('')
    setCoupangSaveMsg('')
    try {
      const res = await fetch('/api/admin/coupang/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          // 지금 폼에서 선택된 카테고리/하위카테고리를 검색으로 등록되는 상품에도 그대로 적용.
          shopCategoryId: pCategoryId || null,
          shopSubcategoryId: pSubcategoryId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '저장에 실패했습니다.')
      const skipNote = data.skipped > 0 ? ` (이미 등록된 상품 ${data.skipped}개는 건너뛰었습니다)` : ''
      setCoupangSaveMsg(`${data.saved}개 상품을 저장했습니다.${skipNote}`)
      setCoupangResults([])
      setSelectedCoupangIds(new Set())
      setCoupangTags({})
      setBulkTagInput('')
      load()
    } catch (err) {
      setCoupangError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setCoupangSaving(false)
    }
  }

  const subcategoriesForForm = useMemo(
    () => subcategories.filter((s) => s.category_id === pCategoryId),
    [subcategories, pCategoryId],
  )

  function resetProductForm() {
    setPTitle(''); setPPriceText(''); setPImageUrl(''); setPLinkUrl('')
    setPTagsInput(''); setPSortOrder('0'); setPIsActive(true)
    setPCategoryId(''); setPSubcategoryId('')
    setPError('')
    setPFormTab('manual')
    setCoupangKeyword(''); setCoupangResults([]); setCoupangError(''); setCoupangSaveMsg('')
    setSelectedCoupangIds(new Set()); setCoupangTags({}); setBulkTagInput('')
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
    setPFormTab('manual')
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

  // 태그 입력란이 비어있을 때만 상품명 기준 추천 태그로 채워준다 (사용자가 직접 입력/수정한 값은 덮어쓰지 않음).
  function handlePTitleChange(value: string) {
    setPTitle(value)
    if (!pTagsInput.trim()) {
      const suggested = suggestTagsFromTitle(value)
      if (suggested.length > 0) setPTagsInput(suggested.join(', '))
    }
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
    const visibleIds = scopedPaged.map((p) => p.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.has(id))
    function toggleSelectAllVisible() {
      setSelectedProductIds((prev) => {
        const next = new Set(prev)
        if (allVisibleSelected) { for (const id of visibleIds) next.delete(id) }
        else { for (const id of visibleIds) next.add(id) }
        return next
      })
    }

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
              type="button" onClick={() => { setStatusFilter('all'); setScopedPage(1) }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'all' ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              전체 ({scopedStatusCounts.all})
            </button>
            <button
              type="button" onClick={() => { setStatusFilter('unpublished'); setScopedPage(1) }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'unpublished' ? 'bg-amber-500 text-white' : 'border border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500'
              }`}
            >
              비공개 ({scopedStatusCounts.unpublished})
            </button>
            <button
              type="button" onClick={() => { setStatusFilter('published'); setScopedPage(1) }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'published' ? 'bg-brand-ink text-white' : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              공개 ({scopedStatusCounts.published})
            </button>
            <input
              type="text" value={listQuery} onChange={(e) => { setListQuery(e.target.value); setScopedPage(1) }}
              placeholder="상품명 검색"
              className="ml-auto w-40 rounded border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-brand-violet"
            />
          </div>
        </div>

        {renderBulkToolbar()}

        {scopedProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">등록된 상품이 없습니다.</div>
        ) : scopedFiltered.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">조건에 맞는 상품이 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                    <th className="w-10 px-4 py-2">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="accent-brand-ink" />
                    </th>
                    <th className="px-4 py-2">이미지</th>
                    <th className="px-4 py-2">상품명</th>
                    <th className="px-4 py-2">가격</th>
                    <th className="px-4 py-2">발행상태</th>
                    <th className="px-4 py-2">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scopedPaged.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2">
                        <input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProductSelect(p.id)} className="accent-brand-ink" />
                      </td>
                      <td className="px-4 py-2">
                        <ImageThumbnail src={p.image_url} alt={p.title} className="h-12 w-12 rounded bg-gray-50 object-contain" />
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

            {scopedTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-3">
                <button type="button" onClick={() => setScopedPage((v) => Math.max(1, v - 1))} disabled={scopedCurrentPage <= 1}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-40">
                  이전
                </button>
                <span className="text-xs text-[#777]">{scopedCurrentPage} / {scopedTotalPages}</span>
                <button type="button" onClick={() => setScopedPage((v) => Math.min(scopedTotalPages, v + 1))} disabled={scopedCurrentPage >= scopedTotalPages}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-40">
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ── 전체 상품 목록(전 카테고리 통합 검색/필터) — 과거 /admin/affiliate 화면의 핵심 기능 ──
  const [allQuery, setAllQuery] = useState('')
  const [allMinPrice, setAllMinPrice] = useState('')
  const [allMaxPrice, setAllMaxPrice] = useState('')
  const [allActiveFilter, setAllActiveFilter] = useState<ActiveFilter>('all')
  const [allPage, setAllPage] = useState(1)

  function handleAllQueryChange(value: string) { setAllQuery(value); setAllPage(1) }
  function handleAllMinPriceChange(value: string) { setAllMinPrice(value); setAllPage(1) }
  function handleAllMaxPriceChange(value: string) { setAllMaxPrice(value); setAllPage(1) }
  function handleAllActiveFilterChange(value: ActiveFilter) { setAllActiveFilter(value); setAllPage(1) }
  function resetAllFilters() {
    setAllQuery(''); setAllMinPrice(''); setAllMaxPrice(''); setAllActiveFilter('all'); setAllPage(1)
  }

  const allFiltered = useMemo(() => {
    const q = allQuery.trim().toLowerCase()
    const min = allMinPrice.trim() !== '' ? Number(allMinPrice) : null
    const max = allMaxPrice.trim() !== '' ? Number(allMaxPrice) : null
    const hasPriceFilter = min !== null || max !== null

    return products.filter((p) => {
      if (allActiveFilter === 'active' && !p.is_active) return false
      if (allActiveFilter === 'inactive' && p.is_active) return false

      if (q) {
        const inTitle = p.title.toLowerCase().includes(q)
        const inTags = (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
        if (!inTitle && !inTags) return false
      }

      if (hasPriceFilter) {
        const price = parsePriceNumber(p.price_text)
        if (price === null) return false
        if (min !== null && price < min) return false
        if (max !== null && price > max) return false
      }

      return true
    })
  }, [products, allQuery, allMinPrice, allMaxPrice, allActiveFilter])

  const hasAllFilter = allQuery.trim() !== '' || allMinPrice.trim() !== '' || allMaxPrice.trim() !== '' || allActiveFilter !== 'all'
  const allTotalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE))
  const allCurrentPage = Math.min(allPage, allTotalPages)
  const allPaged = allFiltered.slice((allCurrentPage - 1) * PAGE_SIZE, allCurrentPage * PAGE_SIZE)
  const allVisibleIds = allPaged.map((p) => p.id)
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedProductIds.has(id))
  function toggleSelectAllInAllList() {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) { for (const id of allVisibleIds) next.delete(id) }
      else { for (const id of allVisibleIds) next.add(id) }
      return next
    })
  }

  const needsAttention = useMemo(() => products.filter((p) => !p.is_active && p.deactivated_reason), [products])
  const attentionIds = useMemo(() => needsAttention.map((p) => p.id), [needsAttention])
  const allAttentionSelected = attentionIds.length > 0 && attentionIds.every((id) => selectedProductIds.has(id))
  const attentionSelectedCount = attentionIds.filter((id) => selectedProductIds.has(id)).length
  function toggleSelectAllAttention() {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (allAttentionSelected) { for (const id of attentionIds) next.delete(id) }
      else { for (const id of attentionIds) next.add(id) }
      return next
    })
  }

  const tagActiveCounts = useMemo(() => {
    const allTags = new Set<string>()
    for (const p of products) for (const t of p.tags ?? []) allTags.add(t)
    return Array.from(allTags)
      .map((tag) => ({ tag, count: products.filter((p) => p.is_active && (p.tags ?? []).includes(tag)).length }))
      .sort((a, b) => a.count - b.count)
  }, [products])

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
                          <div className="flex flex-wrap items-center gap-3">
                            <button onClick={() => openEditCat(c)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                            <button
                              onClick={() => handleGenerateProducts(c.id, undefined, `cat:${c.id}`)}
                              disabled={generatingKey === `cat:${c.id}`}
                              className="text-xs text-brand-primary hover:text-brand-primary-hover disabled:opacity-50"
                            >
                              {generatingKey === `cat:${c.id}` ? '생성 중...' : '상품생성'}
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'category', id: c.id, label: c.name })}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              삭제
                            </button>
                            {generateResult[`cat:${c.id}`] && (
                              <span className={`text-xs ${generateResult[`cat:${c.id}`].ok ? 'text-emerald-600' : 'text-red-500'}`}>
                                {generateResult[`cat:${c.id}`].text}
                              </span>
                            )}
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
                                              <div className="flex flex-wrap items-center gap-2.5">
                                                <button onClick={() => openEditSub(s)} className="text-blue-500 hover:text-blue-700">수정</button>
                                                <button
                                                  onClick={() => handleGenerateProducts(s.category_id, s.id, `sub:${s.id}`)}
                                                  disabled={generatingKey === `sub:${s.id}`}
                                                  className="text-brand-primary hover:text-brand-primary-hover disabled:opacity-50"
                                                >
                                                  {generatingKey === `sub:${s.id}` ? '생성 중...' : '상품생성'}
                                                </button>
                                                <button
                                                  onClick={() => setDeleteTarget({ type: 'subcategory', id: s.id, label: s.name })}
                                                  className="text-red-400 hover:text-red-600"
                                                >
                                                  삭제
                                                </button>
                                                {generateResult[`sub:${s.id}`] && (
                                                  <span className={generateResult[`sub:${s.id}`].ok ? 'text-emerald-600' : 'text-red-500'}>
                                                    {generateResult[`sub:${s.id}`].text}
                                                  </span>
                                                )}
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

      {/* ── 확인 필요 (자동 점검에서 품절/판매중지로 추정되어 비활성화된 상품) ── */}
      {needsAttention.length > 0 && (
        <div className="mt-8 rounded border border-amber-300 bg-amber-50 p-6">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-amber-800">확인 필요 ({needsAttention.length}개)</h2>
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-amber-800">
              <input type="checkbox" checked={allAttentionSelected} onChange={toggleSelectAllAttention} className="accent-brand-ink" />
              전체 선택
            </label>
          </div>
          <p className="mb-3 text-xs text-amber-700">자동 점검에서 품절/판매중지로 추정되어 비활성화된 상품입니다.</p>

          {attentionSelectedCount > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-amber-300 bg-white px-3 py-2">
              <span className="shrink-0 text-xs font-semibold text-brand-ink">{attentionSelectedCount}개 선택됨</span>
              <button type="button" onClick={applyBulkReactivate} disabled={bulkActing}
                className="rounded border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                선택 재활성화
              </button>
              <button type="button" onClick={() => setBulkDeleteConfirm(true)} disabled={bulkActing}
                className="rounded border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
                선택 삭제
              </button>
              <button type="button" onClick={clearSelection}
                className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-[#555] hover:bg-gray-50">
                선택 해제
              </button>
              {bulkError && <p className="w-full text-xs text-red-500">{bulkError}</p>}
            </div>
          )}

          <div className="space-y-2">
            {needsAttention.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded border border-amber-200 bg-white p-3">
                <input
                  type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProductSelect(p.id)}
                  className="shrink-0 accent-brand-ink"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#333]">{p.title}</p>
                  <p className="text-xs text-amber-700">
                    {p.deactivated_reason}
                    {p.deactivated_at ? ` · ${new Date(p.deactivated_at).toLocaleDateString('ko-KR')}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleReactivate(p.id)}
                    className="rounded border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    재활성화
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'product', id: p.id, label: p.title })}
                    className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 태그별 활성 상품 개수 ── */}
      {tagActiveCounts.length > 0 && (
        <div className="mt-8 rounded border border-gray-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-brand-ink">태그별 활성 상품 개수</h2>
          <div className="flex flex-wrap gap-2">
            {tagActiveCounts.map(({ tag, count }) => {
              const isSelected = allQuery.trim() === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAllQueryChange(tag)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-brand-ink text-white'
                      : count < MIN_TAG_COUNT
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-gray-100 text-[#555] hover:bg-gray-200'
                  }`}
                >
                  {tag} {count}개
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 전체 상품(전 카테고리 통합) ── */}
      <div className="mt-8 rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-brand-ink">
              전체 상품 ({hasAllFilter ? `${allFiltered.length}개 / 전체 ${products.length}개` : `${products.length}개`})
            </h2>
            <button
              onClick={openCreateProduct}
              className="shrink-0 rounded bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90"
            >
              + 새 상품 등록
            </button>
          </div>
          {loadError && <p className="mt-1 text-sm text-red-500">목록을 불러오지 못했습니다: {loadError}</p>}

          {products.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={allQuery}
                onChange={(e) => handleAllQueryChange(e.target.value)}
                placeholder="상품명 · 태그 검색"
                className="w-48 rounded border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-brand-violet"
              />
              <input
                type="number"
                value={allMinPrice}
                onChange={(e) => handleAllMinPriceChange(e.target.value)}
                placeholder="최소 금액"
                className="w-28 rounded border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-brand-violet"
              />
              <span className="text-xs text-gray-400">~</span>
              <input
                type="number"
                value={allMaxPrice}
                onChange={(e) => handleAllMaxPriceChange(e.target.value)}
                placeholder="최대 금액"
                className="w-28 rounded border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-brand-violet"
              />

              <div className="ml-auto flex gap-1.5">
                {(['all', 'active', 'inactive'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleAllActiveFilterChange(v)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      allActiveFilter === v
                        ? 'bg-brand-ink text-white'
                        : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                    }`}
                  >
                    {v === 'all' ? '전체' : v === 'active' ? '활성' : '비활성'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {renderBulkToolbar()}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {loadError ? '오류로 목록을 표시할 수 없습니다.' : '등록된 상품이 없습니다.'}
          </div>
        ) : allFiltered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-gray-400">조건에 맞는 상품이 없습니다.</p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded border border-gray-300 px-4 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                    <th className="w-10 whitespace-nowrap px-6 py-3">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllInAllList} className="accent-brand-ink" />
                    </th>
                    <th className="whitespace-nowrap px-6 py-3">썸네일</th>
                    <th className="whitespace-nowrap px-6 py-3">상품명</th>
                    <th className="whitespace-nowrap px-6 py-3">카테고리</th>
                    <th className="whitespace-nowrap px-6 py-3">가격</th>
                    <th className="whitespace-nowrap px-6 py-3">태그</th>
                    <th className="whitespace-nowrap px-6 py-3">활성여부</th>
                    <th className="whitespace-nowrap px-6 py-3">노출수</th>
                    <th className="whitespace-nowrap px-6 py-3">클릭수</th>
                    <th className="whitespace-nowrap px-6 py-3">클릭률</th>
                    <th className="whitespace-nowrap px-6 py-3">마지막 확인</th>
                    <th className="whitespace-nowrap px-6 py-3">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allPaged.map((p) => {
                    const imageBroken = !p.image_url || brokenImageIds.has(p.id)
                    return (
                      <tr key={p.id} className={hasNoPerformance(p) ? 'bg-gray-100' : undefined}>
                        <td className="whitespace-nowrap px-6 py-3">
                          <input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProductSelect(p.id)} className="accent-brand-ink" />
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          {imageBroken ? (
                            <ImageThumbnail src={null} alt={p.title} className="h-14 w-14 rounded" />
                          ) : (
                            <a href={p.image_url!} target="_blank" rel="noopener noreferrer">
                              <ImageThumbnail
                                src={p.image_url}
                                alt={p.title}
                                className="h-14 w-14 rounded bg-gray-50 object-contain"
                                onError={() => markImageBroken(p.id)}
                              />
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-3 font-medium text-[#333]">
                          {p.title}
                          {imageBroken && (
                            <span className="ml-2 whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                              이미지 없음
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-[#777]">{categoryLabel(p)}</td>
                        <td className="whitespace-nowrap px-6 py-3 text-[#777]">{p.price_text ?? '-'}</td>
                        <td className="px-6 py-3 text-[#777]">{(p.tags ?? []).join(', ') || '-'}</td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {p.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-[#777]">{p.impression_count.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-6 py-3 text-[#777]">{p.click_count.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-6 py-3 text-[#777]">{ctrLabel(p.click_count, p.impression_count)}</td>
                        <td className={`whitespace-nowrap px-6 py-3 ${isStale(p.last_checked_at) ? 'bg-amber-50 text-amber-700' : 'text-[#777]'}`}>
                          {p.last_checked_at ? new Date(p.last_checked_at).toLocaleDateString('ko-KR') : '미확인'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleProductActive(p)} className="text-xs text-amber-600 hover:text-amber-800">
                              {p.is_active ? '비공개로' : '공개로'}
                            </button>
                            <button onClick={() => openEditProduct(p.id)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                            <button onClick={() => setDeleteTarget({ type: 'product', id: p.id, label: p.title })} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {allTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                  disabled={allCurrentPage <= 1}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-xs text-[#777]">{allCurrentPage} / {allTotalPages}</span>
                <button
                  type="button"
                  onClick={() => setAllPage((p) => Math.min(allTotalPages, p + 1))}
                  disabled={allCurrentPage >= allTotalPages}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
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
          <div className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-brand-ink">
              {productFormMode === 'edit' ? '상품 수정' : '새 상품 등록'}
            </h3>

            {productFormMode === 'create' && (
              <div className="flex gap-1.5 rounded-lg bg-gray-100 p-1">
                <button
                  type="button" onClick={() => setPFormTab('manual')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${pFormTab === 'manual' ? 'bg-white text-brand-ink shadow-sm' : 'text-[#777]'}`}
                >
                  직접 입력
                </button>
                <button
                  type="button" onClick={() => setPFormTab('coupang')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${pFormTab === 'coupang' ? 'bg-white text-brand-ink shadow-sm' : 'text-[#777]'}`}
                >
                  쿠팡에서 검색
                </button>
              </div>
            )}

            {/* 카테고리/하위카테고리 — 직접 입력·쿠팡 검색 두 방식 공용 */}
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

            {(productFormMode === 'edit' || pFormTab === 'manual') ? (
              <form onSubmit={submitProductForm} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-[#555]">상품명</label>
                  <input
                    type="text" value={pTitle} onChange={(e) => handlePTitleChange(e.target.value)}
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
                    <ImageThumbnail key={pImageUrl} src={pImageUrl.trim() || null} alt="미리보기" className="h-14 w-14 shrink-0 rounded bg-gray-50 object-contain" />
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
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#888]">
                  검색어를 쉼표로 여러 개 입력하면 순차 검색해 결과를 합쳐줍니다. 예: 돼지저금통, 복돼지, 황금돼지
                </p>

                <form onSubmit={handleCoupangSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={coupangKeyword}
                    onChange={(e) => setCoupangKeyword(e.target.value)}
                    placeholder="검색어 입력, 쉼표로 여러 개 가능"
                    className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
                  />
                  <button
                    type="submit"
                    disabled={coupangSearching}
                    className="rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
                  >
                    {coupangSearching ? '검색 중...' : '검색'}
                  </button>
                </form>

                {coupangError && <p className="text-sm text-red-500">{coupangError}</p>}
                {coupangSaveMsg && <p className="text-sm text-emerald-600">{coupangSaveMsg}</p>}

                {coupangResults.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-3 rounded border border-gray-100 bg-gray-50 p-2">
                      <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#555]">
                        <input
                          type="checkbox"
                          checked={allCoupangSelected}
                          onChange={toggleSelectAllCoupang}
                          className="accent-brand-ink"
                        />
                        {allCoupangSelected ? '전체 해제' : '전체 선택'}
                      </label>
                      <input
                        type="text"
                        value={bulkTagInput}
                        onChange={(e) => handleBulkTagChange(e.target.value)}
                        disabled={selectedCoupangIds.size === 0}
                        placeholder="선택 항목에 태그 일괄 입력 (쉼표 구분)"
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-violet disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {coupangResults.map((p) => (
                        <div key={p.productId} className="flex items-center gap-3 rounded border border-gray-100 p-2">
                          <input
                            type="checkbox"
                            checked={selectedCoupangIds.has(p.productId)}
                            onChange={() => toggleCoupangSelect(p.productId)}
                            className="accent-brand-ink"
                          />
                          <ImageThumbnail src={p.productImage} alt={p.productName} className="h-16 w-16 shrink-0 rounded bg-gray-50 object-contain" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#333]">{p.productName}</p>
                            <p className="text-xs text-[#777]">{p.productPrice.toLocaleString()}원</p>
                          </div>
                          <input
                            type="text"
                            value={coupangTags[p.productId] ?? ''}
                            onChange={(e) => setCoupangTags((prev) => ({ ...prev, [p.productId]: e.target.value }))}
                            placeholder="태그 (쉼표 구분)"
                            className="w-32 shrink-0 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-violet"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleCoupangSave}
                      disabled={coupangSaving || selectedCoupangIds.size === 0}
                      className="mt-3 rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
                    >
                      {coupangSaving ? '저장 중...' : `선택 항목 저장 (${selectedCoupangIds.size}개)`}
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button type="button" onClick={closeProductForm}
                    className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50">
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달(단일) ── */}
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

      {/* ── 삭제 확인 모달(일괄) ── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-black text-brand-ink">상품 일괄 삭제</h3>
            <p className="mb-6 text-center text-sm text-[#555]">
              선택한 {selectedProductIds.size}개 상품을 삭제하시겠습니까?<br />삭제 후 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setBulkDeleteConfirm(false)} disabled={bulkActing}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-[#555] hover:bg-gray-50 disabled:opacity-50">
                취소
              </button>
              <button type="button" onClick={confirmBulkDelete} disabled={bulkActing}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                {bulkActing ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
