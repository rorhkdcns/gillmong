'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { keywordToSlug } from '@/lib/slugify'
import { parseDictionaryBody } from '@/lib/dictionaryBody'
import { getCategoryColor } from '@/lib/categoryColor'
import { CHOSEONG_GROUPS, getChoseongGroup } from '@/lib/hangul'
import DictionaryBodyBlocks, { BLOCK_SHAPE } from '@/components/DictionaryBodyBlocks'
import {
  checkAdminDictionarySlugExists,
  createAdminDictionaryEntry,
  deleteAdminDictionaryEntry,
  generateDictionaryDrafts,
  getAdminDictionaryEntries,
  getAdminDictionaryEntryById,
  getAdminDictionarySubcategories,
  updateAdminDictionaryEntry,
  type AdminDictionaryFields,
  type DictionaryDraftBatchResult,
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
type CategoryOption = { slug: string; name: string }
type SubcategoryOption = { slug: string; name: string; parent_slug: string }
type FormMode = 'create' | 'edit'
type StatusFilter = 'all' | 'published' | 'unpublished'

const ALL_CATEGORY = 'all'
const ALL_CHO = 'all'

function matchesStatus(entry: Entry, statusFilter: StatusFilter): boolean {
  if (statusFilter === 'published') return entry.is_published
  if (statusFilter === 'unpublished') return !entry.is_published
  return true
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** base가 이미 쓰이고 있으면 -2, -3 ... 을 붙여서 비어있는 slug를 찾는다. */
async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base
  let n = 2
  while (await checkAdminDictionarySlugExists(candidate, excludeId)) {
    candidate = `${base}-${n}`
    n++
  }
  return candidate
}

export default function AdminDictionaryPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [categories,    setCategories]    = useState<CategoryOption[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([])

  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editId,   setEditId]   = useState<string | null>(null)
  const [slug,             setSlug]             = useState('')
  const [slugTouched,      setSlugTouched]      = useState(false)
  const [slugWarning,      setSlugWarning]      = useState(false)
  const [slugDuplicate,    setSlugDuplicate]    = useState(false)
  const [keyword,          setKeyword]          = useState('')
  const [summary,          setSummary]          = useState('')
  const [body,             setBody]             = useState('')
  const [categorySlug,     setCategorySlug]     = useState('')
  const [subcategorySlug,  setSubcategorySlug]  = useState('')
  const [tagsInput,        setTagsInput]        = useState('')
  const [isPublished,      setIsPublished]      = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORY)
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all')
  const [listQuery,      setListQuery]      = useState('')
  const [choFilter,      setChoFilter]      = useState<string>(ALL_CHO)

  const filteredSubcategories = useMemo(
    () => subcategories.filter((s) => s.parent_slug === categorySlug),
    [subcategories, categorySlug],
  )

  const previewBlocks = useMemo(() => parseDictionaryBody(body), [body])
  const previewColors = useMemo(() => getCategoryColor(categorySlug || null), [categorySlug])
  const previewTags = useMemo(
    () => tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    [tagsInput],
  )
  const previewCategoryName = categories.find((c) => c.slug === categorySlug)?.name ?? '기타'

  // 목록 필터: 검색어 → (카테고리/발행상태/초성 탭 개수용) → 최종 목록(가나다순 정렬)
  // 각 축의 버튼 개수는 "그 축만 빼고 나머지 필터가 전부 적용된" 목록 기준으로 계산해서
  // 다른 탭을 눌렀을 때 몇 건이 나올지 미리 보이게 한다.
  const listSearchFiltered = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.keyword.toLowerCase().includes(q))
  }, [entries, listQuery])

  function matchesCategory(entry: Entry): boolean {
    return categoryFilter === ALL_CATEGORY || entry.category_slug === categoryFilter
  }
  function matchesCho(entry: Entry): boolean {
    return choFilter === ALL_CHO || getChoseongGroup(entry.keyword) === choFilter
  }

  const byStatusAndCho = useMemo(
    () => listSearchFiltered.filter((e) => matchesStatus(e, statusFilter) && matchesCho(e)),
    [listSearchFiltered, statusFilter, choFilter],
  )
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of byStatusAndCho) {
      if (!e.category_slug) continue
      map.set(e.category_slug, (map.get(e.category_slug) ?? 0) + 1)
    }
    return map
  }, [byStatusAndCho])

  const byCategoryAndCho = useMemo(
    () => listSearchFiltered.filter((e) => matchesCategory(e) && matchesCho(e)),
    [listSearchFiltered, categoryFilter, choFilter],
  )
  const statusCounts = useMemo(() => ({
    all: byCategoryAndCho.length,
    published: byCategoryAndCho.filter((e) => e.is_published).length,
    unpublished: byCategoryAndCho.filter((e) => !e.is_published).length,
  }), [byCategoryAndCho])

  const byCategoryAndStatus = useMemo(
    () => listSearchFiltered.filter((e) => matchesCategory(e) && matchesStatus(e, statusFilter)),
    [listSearchFiltered, categoryFilter, statusFilter],
  )
  const choCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of byCategoryAndStatus) {
      const group = getChoseongGroup(e.keyword)
      map.set(group, (map.get(group) ?? 0) + 1)
    }
    return map
  }, [byCategoryAndStatus])

  const filteredEntries = useMemo(
    () => byCategoryAndStatus
      .filter((e) => matchesCho(e))
      .slice()
      .sort((a, b) => a.keyword.localeCompare(b.keyword, 'ko')),
    [byCategoryAndStatus, choFilter],
  )

  const hasListFilter =
    categoryFilter !== ALL_CATEGORY || statusFilter !== 'all' || listQuery.trim() !== '' || choFilter !== ALL_CHO

  function resetListFilters() {
    setCategoryFilter(ALL_CATEGORY)
    setStatusFilter('all')
    setListQuery('')
    setChoFilter(ALL_CHO)
  }

  async function load() {
    setLoading(true)
    const { data } = await getAdminDictionaryEntries()
    setEntries(data as Entry[])
    setLoading(false)
  }

  useEffect(() => {
    load()

    const supabase = createClient()
    supabase
      .from('categories')
      .select('slug, name')
      .eq('domain', 'dream')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }: { data: CategoryOption[] | null }) => setCategories(data ?? []))

    getAdminDictionarySubcategories().then(({ data }) => setSubcategories(data as SubcategoryOption[]))
  }, [])

  // slug 중복 검사 (입력이 멈추면 잠깐 뒤에 확인)
  useEffect(() => {
    const trimmed = slug.trim()
    const timer = setTimeout(async () => {
      if (!trimmed || !SLUG_PATTERN.test(trimmed)) { setSlugDuplicate(false); return }
      const exists = await checkAdminDictionarySlugExists(trimmed, formMode === 'edit' ? editId ?? undefined : undefined)
      setSlugDuplicate(exists)
    }, 400)
    return () => clearTimeout(timer)
  }, [slug, formMode, editId])

  function resetForm() {
    setSlug(''); setSlugTouched(false); setSlugWarning(false); setSlugDuplicate(false)
    setKeyword(''); setSummary(''); setBody('')
    setCategorySlug(''); setSubcategorySlug(''); setTagsInput(''); setIsPublished(false)
    setError('')
    setShowPreview(false)
  }

  function handleSlugChange(value: string) {
    setSlug(value)
    setSlugTouched(true)
    setSlugWarning(false)
  }

  async function autoGenerateSlug() {
    const result = keywordToSlug(keyword)
    setSlugWarning(result.hasUnmatched)
    if (!result.slug) { setSlug(''); return }
    const unique = await generateUniqueSlug(result.slug, formMode === 'edit' ? editId ?? undefined : undefined)
    setSlug(unique)
  }

  function handleKeywordBlur() {
    // slug를 사용자가 직접 건드린 적이 없을 때만 자동 채움 — 이미 손댄 값은 덮어쓰지 않는다.
    if (!slugTouched) autoGenerateSlug()
  }

  function handleCategoryChange(value: string) {
    setCategorySlug(value)
    // 대분류가 바뀌면 기존에 선택된 소분류가 새 대분류 소속이 아닐 수 있으므로 초기화
    if (!subcategories.some((s) => s.slug === subcategorySlug && s.parent_slug === value)) {
      setSubcategorySlug('')
    }
  }

  function openCreateForm() {
    setFormMode('create')
    setEditId(null)
    resetForm()
    setShowForm(true)
  }

  async function openEditForm(id: string) {
    // ★ /admin 레이아웃(src/app/admin/layout.tsx)은 <div className="h-screen overflow-hidden">
    //   안에 <main className="overflow-y-auto">가 실제 스크롤 컨테이너다 — window가 아니라
    //   이 main이 스크롤되는 구조라 window.scrollTo()는 효과가 없었다. 어드민 트리 전체에
    //   main 요소가 이거 하나뿐이라 querySelector('main')으로 확실하게 타겟팅된다.
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    setError('')
    setShowForm(true)
    setFormMode('edit')
    setEditId(id)
    setKeyword('로딩 중...')
    const entry = await getAdminDictionaryEntryById(id) as {
      slug: string; keyword: string; summary: string; body: string
      category_slug: string | null; subcategory_slug: string | null
      tags: string[] | null; is_published: boolean
    } | null
    if (!entry) { setError('사전 항목을 불러올 수 없습니다.'); return }
    setSlug(entry.slug)
    setSlugTouched(true) // 이미 저장된 slug이므로 키워드 수정 시 자동으로 덮어쓰지 않음
    setSlugWarning(false)
    setKeyword(entry.keyword)
    setSummary(entry.summary)
    setBody(entry.body)
    setCategorySlug(entry.category_slug ?? '')
    setSubcategorySlug(entry.subcategory_slug ?? '')
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
    if (slugDuplicate) { setError('이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.'); return }
    if (!keyword.trim()) { setError('키워드를 입력해주세요.'); return }
    if (!summary.trim()) { setError('요약을 입력해주세요.'); return }
    if (!body.trim())    { setError('본문을 입력해주세요.'); return }

    const fields: AdminDictionaryFields = {
      slug: finalSlug,
      keyword: keyword.trim(),
      summary: summary.trim(),
      body: body.trim(),
      categorySlug: categorySlug.trim() || null,
      subcategorySlug: subcategorySlug.trim() || null,
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

  // ── 글생성 (구 generate_drafts.py 대체) ──────────────────────────────
  const [draftCount, setDraftCount] = useState(1)
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [draftResult, setDraftResult] = useState<DictionaryDraftBatchResult | null>(null)

  function handleDraftCountChange(value: string) {
    const n = parseInt(value, 10)
    setDraftCount(Number.isNaN(n) ? 1 : Math.min(20, Math.max(1, n)))
  }

  async function handleGenerateDraft() {
    setGeneratingDraft(true)
    setDraftResult(null)
    const result = await generateDictionaryDrafts(categoryFilter === ALL_CATEGORY ? undefined : categoryFilter, draftCount)
    setGeneratingDraft(false)
    setDraftResult(result)
    if (result.succeeded > 0) load()
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
        <>
        <form onSubmit={handleSubmit} className="mb-8 max-w-2xl space-y-4 rounded border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-brand-ink">
            {formMode === 'edit' ? '사전 항목 수정' : '새 사전 항목'}
          </h2>

          <div>
            <label className="mb-1 block text-sm text-[#555]">slug (URL용, 영문 소문자+하이픈만)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="예: pig-dream"
                className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
              <button
                type="button"
                onClick={autoGenerateSlug}
                className="shrink-0 rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-[#555] hover:bg-gray-50"
              >
                자동 생성
              </button>
            </div>
            {slugWarning && (
              <p className="mt-1 text-xs text-amber-600">일부 단어를 찾지 못했습니다. 확인해주세요.</p>
            )}
            {slugDuplicate && (
              <p className="mt-1 text-xs text-red-500">이미 사용 중인 slug입니다.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">키워드</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onBlur={handleKeywordBlur}
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
              placeholder={'[[소제목]]\n문단 내용\n\n>항목명 | 설명\n\n[[!주의 섹션 제목]]\n문단 내용'}
              className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-violet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">대분류 (선택)</label>
            <select
              value={categorySlug}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-violet"
            >
              <option value="">선택 안 함</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#555]">소분류 (선택, 대분류를 먼저 선택해야 표시됩니다)</label>
            <select
              value={subcategorySlug}
              onChange={(e) => setSubcategorySlug(e.target.value)}
              disabled={!categorySlug}
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-violet disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">선택 안 함</option>
              {filteredSubcategories.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
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
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-[#555] hover:bg-gray-50"
            >
              {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
            </button>
          </div>
        </form>

        {showPreview && (
          <div className="mb-8 max-w-[600px] rounded-[14px] p-4" style={{ backgroundColor: '#DDE6EC' }}>
            <div className="flex flex-col gap-[14px]">
              {/* 헤더 블록 */}
              <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(11,36,51,0.06)]">
                <div
                  className="flex flex-wrap items-center gap-1.5 px-[18px] py-2.5 text-sm text-white md:px-6"
                  style={{ backgroundColor: previewColors.main }}
                >
                  <span>{previewCategoryName}</span>
                </div>
                <div className="p-[20px_18px] md:p-[26px_24px]">
                  <h1 className="mb-3 text-2xl font-medium text-[#0B2433] md:text-3xl">
                    {keyword.trim() || '(키워드 없음)'} 해몽
                  </h1>
                  <p className="text-[18px] leading-[1.85] text-[#1C3547]">
                    {summary.trim() || '(요약 없음)'}
                  </p>
                  {previewTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {previewTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[8px] bg-brand-primary-light px-3 py-1 text-[14px] font-semibold text-brand-primary-hover"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 본문 블록 */}
              {previewBlocks.length > 0 ? (
                <DictionaryBodyBlocks blocks={previewBlocks} colors={previewColors} />
              ) : (
                <div className={`${BLOCK_SHAPE} bg-white text-sm text-gray-400`}>
                  본문을 입력하면 여기에 미리보기가 표시됩니다.
                </div>
              )}
            </div>
          </div>
        )}
        </>
      )}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-brand-ink">
            등록된 항목 ({hasListFilter ? `${filteredEntries.length}개 / 전체 ${entries.length}개` : `${entries.length}개`})
          </h2>

          {/* 카테고리 탭 */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter(ALL_CATEGORY)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                categoryFilter === ALL_CATEGORY
                  ? 'bg-brand-ink text-white'
                  : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              전체 ({byStatusAndCho.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategoryFilter(c.slug)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  categoryFilter === c.slug
                    ? 'bg-brand-ink text-white'
                    : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                }`}
              >
                {c.name} ({categoryCounts.get(c.slug) ?? 0})
              </button>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={20}
                value={draftCount}
                onChange={(e) => handleDraftCountChange(e.target.value)}
                disabled={generatingDraft}
                className="w-14 rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-violet disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={generatingDraft}
                className="rounded bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-60"
              >
                {generatingDraft ? '생성 중...' : `${draftCount}개 글생성`}
              </button>
            </div>
          </div>
          {draftResult && (
            <div className="mt-2 text-xs">
              {draftResult.requested === 0 ? (
                <p className="text-red-500">{draftResult.stoppedReason}</p>
              ) : draftResult.succeeded === 0 && draftResult.failed === 0 ? (
                <p className="text-gray-500">{draftResult.stoppedReason ?? '생성할 표제어가 없습니다.'}</p>
              ) : (
                <p className={draftResult.failed > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {draftResult.succeeded}개 생성 완료{draftResult.failed > 0 ? ` (실패 ${draftResult.failed}개)` : ''}
                  {draftResult.stoppedReason ? ` — ${draftResult.stoppedReason}` : ''}
                </p>
              )}
              {draftResult.results.some((r) => r.status === 'error') && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-red-500">
                  {draftResult.results.filter((r) => r.status === 'error').map((r, i) => (
                    <li key={i}>{r.headword}: {r.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 발행상태 필터 */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-brand-ink text-white'
                  : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              전체 ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unpublished')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'unpublished'
                  ? 'bg-amber-500 text-white'
                  : 'border border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500'
              }`}
            >
              비공개 ({statusCounts.unpublished})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === 'published'
                  ? 'bg-brand-ink text-white'
                  : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              발행됨 ({statusCounts.published})
            </button>

            <input
              type="text"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="키워드로 검색"
              className="ml-auto w-48 rounded border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-brand-violet"
            />
          </div>

          {/* 초성 필터 */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setChoFilter(ALL_CHO)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                choFilter === ALL_CHO
                  ? 'bg-brand-ink text-white'
                  : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
              }`}
            >
              전체
            </button>
            {CHOSEONG_GROUPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChoFilter(c)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  choFilter === c
                    ? 'bg-brand-ink text-white'
                    : 'border border-gray-200 text-[#555] hover:border-brand-violet hover:text-brand-violet'
                }`}
              >
                {c} ({choCounts.get(c) ?? 0})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">등록된 사전 항목이 없습니다.</div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-gray-400">조건에 맞는 항목이 없습니다.</p>
            <button
              type="button"
              onClick={resetListFilters}
              className="rounded border border-gray-300 px-4 py-1.5 text-xs font-semibold text-[#555] hover:bg-gray-50"
            >
              필터 초기화
            </button>
          </div>
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
              {filteredEntries.map((e) => (
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
