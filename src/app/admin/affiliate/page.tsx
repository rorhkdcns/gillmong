'use client'

import { useState, useEffect } from 'react'
import {
  createAdminAffiliateProduct,
  deleteAdminAffiliateProduct,
  getAdminAffiliateProducts,
  getAdminAffiliateProductById,
  updateAdminAffiliateProduct,
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
}
type FormMode = 'create' | 'edit'

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
