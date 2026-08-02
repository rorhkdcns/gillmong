'use client'

import { useState, useEffect } from 'react'
import {
  createAdminAffiliateProduct,
  deleteAdminAffiliateProduct,
  getAdminAffiliateProducts,
  getAdminAffiliateProductById,
  updateAdminAffiliateProduct,
  reactivateAdminAffiliateProduct,
  type AdminAffiliateFields,
} from '../actions'

type Product = {
  id: string
  title: string
  price_text: string | null
  tags: string[] | null
  sort_order: number
  is_active: boolean
  click_count: number
  last_checked_at: string | null
  deactivated_reason: string | null
  deactivated_at: string | null
}

const STALE_DAYS = 30
const MIN_TAG_COUNT = 3

function isStale(lastCheckedAt: string | null): boolean {
  if (!lastCheckedAt) return true
  const diffDays = (Date.now() - new Date(lastCheckedAt).getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= STALE_DAYS
}
type FormMode = 'create' | 'edit'

interface CoupangProduct {
  productId: number
  productName: string
  productPrice: number
  productImage: string
  productUrl: string
  isRocket: boolean
  isFreeShipping: boolean
}

export default function AdminAffiliatePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editId,   setEditId]   = useState<string | null>(null)
  const [title,      setTitle]      = useState('')
  const [priceText,  setPriceText]  = useState('')
  const [imageUrl,   setImageUrl]   = useState('')
  const [linkUrl,    setLinkUrl]    = useState('')
  const [tagsInput,  setTagsInput]  = useState('')
  const [sortOrder,  setSortOrder]  = useState('0')
  const [isActive,   setIsActive]   = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [showForm, setShowForm] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── 쿠팡에서 가져오기 ──────────────────────────────
  const [coupangKeyword,   setCoupangKeyword]   = useState('')
  const [coupangResults,   setCoupangResults]   = useState<CoupangProduct[]>([])
  const [coupangSearching, setCoupangSearching] = useState(false)
  const [coupangError,     setCoupangError]     = useState('')
  const [coupangSaveMsg,   setCoupangSaveMsg]   = useState('')
  const [selectedIds,      setSelectedIds]      = useState<Set<number>>(new Set())
  const [coupangTags,      setCoupangTags]      = useState<Record<number, string>>({})
  const [coupangSaving,    setCoupangSaving]    = useState(false)

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
        body: JSON.stringify({ keyword: coupangKeyword.trim(), limit: 20 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '검색에 실패했습니다.')
      setCoupangResults(data.products ?? [])
      setSelectedIds(new Set())
      setCoupangTags({})
    } catch (err) {
      setCoupangError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
      setCoupangResults([])
    } finally {
      setCoupangSearching(false)
    }
  }

  function toggleCoupangSelect(productId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  async function handleCoupangSave() {
    const items = coupangResults
      .filter((p) => selectedIds.has(p.productId))
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        productPrice: p.productPrice,
        productImage: p.productImage,
        productUrl: p.productUrl,
        tags: (coupangTags[p.productId] ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      }))
    if (items.length === 0) { setCoupangError('저장할 상품을 선택해주세요.'); return }

    setCoupangSaving(true)
    setCoupangError('')
    setCoupangSaveMsg('')
    try {
      const res = await fetch('/api/admin/coupang/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '저장에 실패했습니다.')
      setCoupangSaveMsg(`${data.saved}개 상품을 저장했습니다.`)
      setCoupangResults([])
      setSelectedIds(new Set())
      setCoupangTags({})
      load()
    } catch (err) {
      setCoupangError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setCoupangSaving(false)
    }
  }

  async function load() {
    setLoading(true)
    const { data } = await getAdminAffiliateProducts()
    setProducts(data as Product[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setTitle(''); setPriceText(''); setImageUrl(''); setLinkUrl('')
    setTagsInput(''); setSortOrder('0'); setIsActive(true)
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
    setTitle('로딩 중...')
    const product = await getAdminAffiliateProductById(id) as {
      title: string; price_text: string | null; image_url: string | null; link_url: string
      tags: string[] | null; sort_order: number; is_active: boolean
    } | null
    if (!product) { setError('상품을 불러올 수 없습니다.'); return }
    setTitle(product.title)
    setPriceText(product.price_text ?? '')
    setImageUrl(product.image_url ?? '')
    setLinkUrl(product.link_url)
    setTagsInput((product.tags ?? []).join(', '))
    setSortOrder(String(product.sort_order))
    setIsActive(product.is_active)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim())   { setError('상품명을 입력해주세요.'); return }
    if (!linkUrl.trim()) { setError('링크(URL)를 입력해주세요.'); return }

    const fields: AdminAffiliateFields = {
      title: title.trim(),
      priceText: priceText.trim() || null,
      imageUrl: imageUrl.trim() || null,
      linkUrl: linkUrl.trim(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      sortOrder: Number(sortOrder) || 0,
      isActive,
    }

    setSaving(true)
    setError('')
    const result = formMode === 'edit' && editId
      ? await updateAdminAffiliateProduct(editId, fields)
      : await createAdminAffiliateProduct(fields)
    setSaving(false)

    if (result.error) { setError(result.error); return }
    closeForm()
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteAdminAffiliateProduct(deleteTarget)
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  async function handleReactivate(id: string) {
    await reactivateAdminAffiliateProduct(id)
    load()
  }

  const needsAttention = products.filter((p) => !p.is_active && p.deactivated_reason)

  const allTags = new Set<string>()
  for (const p of products) for (const t of p.tags ?? []) allTags.add(t)
  const tagActiveCounts = Array.from(allTags)
    .map((tag) => ({
      tag,
      count: products.filter((p) => p.is_active && (p.tags ?? []).includes(tag)).length,
    }))
    .sort((a, b) => a.count - b.count)

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-xl font-bold text-brand-ink sm:text-2xl">제휴 상품 관리</h1>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90"
        >
          {showForm ? '취소' : '+ 새 상품'}
        </button>
      </div>

      {needsAttention.length > 0 && (
        <div className="mb-8 rounded border border-amber-300 bg-amber-50 p-6">
          <h2 className="mb-1 font-semibold text-amber-800">확인 필요 ({needsAttention.length}개)</h2>
          <p className="mb-3 text-xs text-amber-700">자동 점검에서 품절/판매중지로 추정되어 비활성화된 상품입니다.</p>
          <div className="space-y-2">
            {needsAttention.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded border border-amber-200 bg-white p-3">
                <div className="min-w-0">
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
                    onClick={() => setDeleteTarget(p.id)}
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

      {tagActiveCounts.length > 0 && (
        <div className="mb-8 rounded border border-gray-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-brand-ink">태그별 활성 상품 개수</h2>
          <div className="flex flex-wrap gap-2">
            {tagActiveCounts.map(({ tag, count }) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  count < MIN_TAG_COUNT ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-[#555]'
                }`}
              >
                {tag} {count}개
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 max-w-2xl rounded border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-brand-ink">쿠팡에서 가져오기</h2>

        <form onSubmit={handleCoupangSearch} className="flex gap-2">
          <input
            type="text"
            value={coupangKeyword}
            onChange={(e) => setCoupangKeyword(e.target.value)}
            placeholder="검색어 입력 (예: 돼지 저금통)"
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

        {coupangError && <p className="mt-3 text-sm text-red-500">{coupangError}</p>}
        {coupangSaveMsg && <p className="mt-3 text-sm text-emerald-600">{coupangSaveMsg}</p>}

        {coupangResults.length > 0 && (
          <div className="mt-4">
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {coupangResults.map((p) => (
                <div key={p.productId} className="flex items-center gap-3 rounded border border-gray-100 p-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.productId)}
                    onChange={() => toggleCoupangSelect(p.productId)}
                    className="accent-brand-ink"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.productImage} alt={p.productName} className="h-14 w-14 shrink-0 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#333]">{p.productName}</p>
                    <p className="text-xs text-[#777]">{p.productPrice.toLocaleString()}원</p>
                  </div>
                  <input
                    type="text"
                    value={coupangTags[p.productId] ?? ''}
                    onChange={(e) => setCoupangTags((prev) => ({ ...prev, [p.productId]: e.target.value }))}
                    placeholder="태그 (쉼표 구분)"
                    className="w-40 shrink-0 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-brand-violet"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCoupangSave}
              disabled={coupangSaving || selectedIds.size === 0}
              className="mt-3 rounded bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
            >
              {coupangSaving ? '저장 중...' : `선택 항목 저장 (${selectedIds.size}개)`}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-2xl space-y-4 rounded border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-brand-ink">
            {formMode === 'edit' ? '제휴 상품 수정' : '새 제휴 상품'}
          </h2>

          <div>
            <label className="mb-1 block text-sm text-[#555]">상품명</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">가격 텍스트 (선택)</label>
            <input
              type="text"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              placeholder="예: 12,900원"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">이미지 URL (선택)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">
              링크 URL <span className="text-xs text-gray-400">(쿠팡 파트너스 등에서 발급받은 링크를 직접 입력하세요)</span>
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://link.coupang.com/..."
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">태그 (쉼표로 구분, 사전 항목과 매칭됨)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="예: 돼지, 재물운"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">정렬 순서 (작을수록 먼저 노출)</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-32 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#555]">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-brand-ink" />
            활성 (체크 시 공개 페이지에 노출)
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
          <h2 className="font-semibold text-brand-ink">등록된 상품 ({products.length}개)</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">등록된 제휴 상품이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-[#999]">
                <th className="px-6 py-3">상품명</th>
                <th className="px-6 py-3">가격</th>
                <th className="px-6 py-3">태그</th>
                <th className="px-6 py-3">활성여부</th>
                <th className="px-6 py-3">클릭수</th>
                <th className="px-6 py-3">마지막 확인</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-medium text-[#333]">{p.title}</td>
                  <td className="px-6 py-3 text-[#777]">{p.price_text ?? '-'}</td>
                  <td className="px-6 py-3 text-[#777]">{(p.tags ?? []).join(', ') || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[#777]">{p.click_count.toLocaleString()}</td>
                  <td className={`px-6 py-3 ${isStale(p.last_checked_at) ? 'bg-amber-50 text-amber-700' : 'text-[#777]'}`}>
                    {p.last_checked_at ? new Date(p.last_checked_at).toLocaleDateString('ko-KR') : '미확인'}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditForm(p.id)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                      <button onClick={() => setDeleteTarget(p.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
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
            <h3 className="mb-2 text-center text-lg font-black text-brand-ink">제휴 상품 삭제</h3>
            <p className="mb-6 text-center text-sm text-[#555]">이 상품을 삭제하시겠습니까?<br />삭제 후 복구할 수 없습니다.</p>
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
