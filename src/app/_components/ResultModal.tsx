'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GRADE_INFO, TYPE_STYLE, parseInterpretation, type Grade } from '@/lib/dreamDisplay'

interface CategoryOption {
  id: string
  name: string
  slug: string
}

export interface AnalysisResult {
  alphabet: string
  type: string
  title: string
  summary: string
  interpretation: string
  advice: string
  lucky_numbers: number[]
  isAdult?: boolean
  supportNotice?: string | null
}

interface ResultModalProps {
  dream: string
  originalText: string
  analysis: AnalysisResult
  onClose: () => void
}

export default function ResultModal({ dream, originalText, analysis, onClose }: ResultModalProps) {
  const router = useRouter()
  const alphaBg = GRADE_INFO[analysis.alphabet as Grade]?.badgeBg ?? 'bg-gray-400'

  const [mode, setMode] = useState<'original' | 'ai'>(originalText.length >= 600 ? 'original' : 'ai')
  const [editedAi, setEditedAi]             = useState(dream)
  const [editedOriginal, setEditedOriginal] = useState(originalText)
  const editedDream = mode === 'original' ? editedOriginal : editedAi
  function setEditedDream(value: string) {
    if (mode === 'original') setEditedOriginal(value)
    else setEditedAi(value)
  }
  const dreamTextareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = dreamTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [editedDream])

  const [title, setTitle]       = useState(analysis.title)
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [price, setPrice]       = useState('5000')
  const [priceError, setPriceError] = useState('')
  const [saving, setSaving]         = useState(false)
  const [savingPrivate, setSavingPrivate] = useState(false)
  const [saveError, setSaveError]   = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('domain', 'dream')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }: { data: CategoryOption[] | null }) => setCategories(data ?? []))
  }, [])

  function validatePrice(val: number): string {
    if (!val || isNaN(val)) return '올바른 금액을 입력해주세요.'
    if (val < 5000)         return '최소 5,000원 이상 입력해주세요.'
    if (val % 100 !== 0)    return '판매금액은 100원 단위로 입력해주세요.'
    return ''
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setPrice(v)
    setPriceError(validatePrice(Number(v)))
  }

  function handlePriceBlur() {
    const val = Number(price)
    if (!price || isNaN(val)) { setPrice('5000'); setPriceError(''); return }
    setPriceError(validatePrice(val))
  }

  async function ensureProfile(supabase: ReturnType<typeof createClient>, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (existing) return true
    const username = (user.user_metadata?.username as string) ?? user.email?.replace('@gillmong.com', '') ?? user.id.slice(0, 8)
    const nickname = (user.user_metadata?.nickname as string) ?? username
    const { error } = await supabase.from('profiles').insert({ id: user.id, username, nickname })
    return !error
  }

  async function handlePrivateSave() {
    if (!title.trim()) { setSaveError('꿈 제목을 입력해주세요.'); return }
    setSaveError('')
    setSavingPrivate(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setSavingPrivate(false); setSaveError('로그인이 필요합니다.'); return }
    const user = session.user

    await ensureProfile(supabase, user)

    const { error } = await supabase
      .from('saved_dreams')
      .insert({
        user_id:        user.id,
        title:          title.trim(),
        content:        editedDream.trim(),
        original_text:  originalText,
        content_mode:   mode,
        summary:        analysis.summary || editedDream.trim().slice(0, 100),
        grade:          analysis.alphabet,
        type:           analysis.type,
        interpretation: analysis.interpretation,
        advice:         analysis.advice,
        lucky_numbers:  analysis.lucky_numbers,
        is_adult:       analysis.isAdult ?? false,
      })

    if (error) { setSavingPrivate(false); setSaveError(`저장 오류: ${error.message}`); return }

    window.dispatchEvent(new Event('dream-analyzed'))
    setSavingPrivate(false)
    onClose()
    router.push('/mypage')
    router.refresh()
  }

  async function handleRegister() {
    if (!title.trim()) { setSaveError('꿈 제목을 입력해주세요.'); return }
    if (!category)     { setSaveError('카테고리를 선택해주세요.'); return }
    const priceVal = Number(price)
    if (!price || priceVal < 5000)  { setSaveError('최소 5,000원 이상 입력해주세요.'); return }
    if (priceVal % 100 !== 0)       { setSaveError('판매금액은 100원 단위로 입력해주세요.'); return }

    setSaveError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      setSaving(false)
      setSaveError('로그인이 필요합니다.')
      return
    }
    const user = session.user

    await ensureProfile(supabase, user)

    const selectedCategory = categories.find((c) => c.slug === category)

    const { data: inserted, error } = await supabase
      .from('dreams')
      .insert({
        user_id:        user.id,
        title:          title.trim(),
        content:        editedDream.trim(),
        original_text:  originalText,
        content_mode:   mode,
        summary:        analysis.summary || editedDream.trim().slice(0, 100),
        grade:          analysis.alphabet,
        dream_type:     analysis.type,
        interpretation: analysis.interpretation,
        advice:         analysis.advice,
        category:       category || 'etc',
        category_id:    selectedCategory?.id ?? null,
        price:          Number(price),
        lucky_numbers:  analysis.lucky_numbers,
        is_adult:       analysis.isAdult ?? false,
      })
      .select('id')
      .single()

    if (error) {
      setSaving(false)
      setSaveError(`등록 오류: ${error.message}`)
      return
    }

    window.dispatchEvent(new Event('dream-analyzed'))
    setSaving(false)
    onClose()
    router.push('/mypage')
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/60 px-4 pb-8 pt-[84px]">
      <div className="relative mx-auto w-full max-w-lg md:max-w-[800px] rounded-2xl bg-white shadow-2xl">

        {/* X 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          aria-label="닫기"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-5">

          {/* 제목 */}
          <h2 className="mb-4 text-center text-xl font-black text-brand-heading">길몽상점 감정 결과</h2>

          {/* 알파벳 원형 — 중앙 상단 */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full ${alphaBg} shadow-lg`}>
              <span className="text-4xl font-black text-white">{analysis.alphabet}</span>
            </div>

            {/* 태그들 — 중앙 정렬 */}
            <div className="flex flex-row items-center justify-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${TYPE_STYLE[analysis.type] ?? TYPE_STYLE['중립']}`}>
                {analysis.type}
              </span>
            </div>

            {/* 요약 텍스트 — 태그 아래 */}
            {analysis.summary && (
              <p className="max-w-sm text-center text-sm leading-relaxed text-brand-body">
                {analysis.summary}
              </p>
            )}
          </div>

          <hr className="mb-4 border-brand-border" />

          {/* 나의 꿈 기록 */}
          <section className="mb-4">
            <h3 className="mb-1.5 text-sm font-bold text-brand-muted">
              나의 꿈 기록
              <span className="ml-1.5 text-xs font-normal text-gray-400">직접 수정 가능</span>
            </h3>

            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('original')}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  mode === 'original'
                    ? 'border-brand-violet bg-brand-violet text-white'
                    : 'border-[#CCCCCC] bg-white text-brand-muted hover:border-brand-violet'
                }`}
              >
                내가 쓴 그대로
                <span className="ml-1 font-normal opacity-80">{editedOriginal.length.toLocaleString()}자</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  mode === 'ai'
                    ? 'border-brand-violet bg-brand-violet text-white'
                    : 'border-[#CCCCCC] bg-white text-brand-muted hover:border-brand-violet'
                }`}
              >
                AI가 다듬은 글
                <span className="ml-1 font-normal opacity-80">{editedAi.length.toLocaleString()}자</span>
              </button>
            </div>

            <textarea
              ref={dreamTextareaRef}
              value={editedDream}
              onChange={(e) => setEditedDream(e.target.value)}
              rows={3}
              className="w-full max-h-[60vh] resize-none overflow-y-auto rounded-lg bg-brand-page px-3 py-2 text-sm leading-relaxed text-brand-body outline-none focus:ring-1 focus:ring-brand-violet"
            />
          </section>

          {/* 상세 해몽 */}
          {analysis.interpretation && (() => {
            const sections = parseInterpretation(analysis.interpretation)
            return (
              <section className="mb-4">
                <h3 className="mb-1.5 text-sm font-bold text-brand-muted">상세 해몽</h3>
                <div className="rounded-lg border border-[#CCCCCC] overflow-hidden">
                  {sections.length > 0 ? sections.map((sec, i) => (
                    <div key={i}>
                      {i > 0 && <hr style={{ borderColor: '#EEEEEE' }} />}
                      <div className="px-3 py-2">
                        <p className="mb-1 text-xs font-bold" style={{ color: sec.color }}>{sec.title}</p>
                        <p className="text-sm leading-relaxed text-brand-body whitespace-pre-line">{sec.content}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-3 py-2 text-sm leading-relaxed text-brand-body whitespace-pre-line">
                      {analysis.interpretation}
                    </div>
                  )}
                </div>
              </section>
            )
          })()}

          {/* 실생활 조언 */}
          {analysis.advice && (
            <section className="mb-4">
              <h3 className="mb-1.5 text-sm font-bold text-brand-muted">실생활 조언</h3>
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm leading-relaxed text-brand-body">
                {analysis.advice}
              </div>
            </section>
          )}

          {/* 행운의 추천 번호 */}
          <section className="mb-4">
            <h3 className="mb-2 text-sm font-bold text-brand-muted">행운의 추천 번호</h3>
            <div className="flex justify-center gap-2">
              {analysis.lucky_numbers.map((num) => (
                <div
                  key={num}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-violet to-brand-pink text-sm font-black text-white shadow"
                >
                  {num}
                </div>
              ))}
            </div>
          </section>

          <hr className="mb-4 border-brand-border" />

          {/* 마켓 판매 등록 */}
          <section>
            <h3 className="mb-3 text-sm font-black text-brand-heading">마켓 판매 등록</h3>

            <div className="mb-2">
              <label className="mb-1 block text-sm font-medium text-brand-body">꿈 제목 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="꿈을 한 줄로 표현해주세요"
                className="w-full rounded-lg border border-[#CCCCCC] bg-white px-3 py-2 text-sm text-brand-heading outline-none focus:border-brand-violet"
              />
            </div>

            <div className="mb-2">
              <label className="mb-1 block text-sm font-medium text-brand-body">카테고리 <span className="text-red-400">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[#CCCCCC] bg-white px-3 py-2 text-sm text-brand-heading outline-none"
              >
                <option value="">카테고리를 선택해주세요</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-brand-body">감정가 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  min="5000"
                  step="100"
                  className="w-full rounded-lg border border-[#CCCCCC] bg-white px-3 py-2 pr-8 text-sm text-brand-heading outline-none focus:border-brand-violet"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted">P</span>
              </div>
              {priceError && <p className="mt-1 text-xs text-red-500">{priceError}</p>}
            </div>

            {saveError && (
              <p className="mb-3 text-sm text-red-500">{saveError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRegister}
                disabled={saving || savingPrivate || !!priceError}
                className="flex-1 rounded-lg bg-gradient-to-r from-brand-violet to-brand-pink py-2.5 text-sm font-bold text-white transition-all hover:brightness-95 disabled:opacity-60"
              >
                {saving ? '등록 중...' : '마켓 등록'}
              </button>
              <button
                onClick={handlePrivateSave}
                disabled={saving || savingPrivate}
                className="flex-1 rounded-lg border-2 border-brand-violet bg-white py-2.5 text-sm font-bold text-brand-violet-deep transition-colors hover:bg-brand-violet hover:text-white disabled:opacity-60"
              >
                {savingPrivate ? '저장 중...' : '개인 저장'}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
              >
                닫기
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
