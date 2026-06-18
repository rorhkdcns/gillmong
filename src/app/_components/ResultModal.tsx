'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
const CATEGORIES = [
  { label: '인물·신체', value: 'people'  },
  { label: '동물·식물', value: 'animals' },
  { label: '자연·사물', value: 'nature'  },
  { label: '행동·상황', value: 'action'  },
  { label: '기타',      value: 'etc'     },
]

const INTERP_SECTIONS = [
  { pattern: /한국\s*전통\s*해몽\s*관점\s*:/, color: '#01273A' },
  { pattern: /아시아\s*관점[^:]*:/,            color: '#E07B2A' },
  { pattern: /서양\s*심리학적\s*관점\s*:/,     color: '#6B96A8' },
  { pattern: /종합\s*해석\s*:/,                color: '#01273A' },
]

function parseInterpretation(text: string) {
  const lines = text.split('\n')
  const sections: { title: string; content: string; color: string }[] = []
  let cur: { title: string; lines: string[]; color: string } | null = null

  for (const line of lines) {
    const matched = INTERP_SECTIONS.find((s) => s.pattern.test(line.trim()))
    if (matched) {
      if (cur) sections.push({ title: cur.title, content: cur.lines.join('\n').trim(), color: cur.color })
      cur = { title: line.trim(), lines: [], color: matched.color }
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  if (cur) sections.push({ title: cur.title, content: cur.lines.join('\n').trim(), color: cur.color })
  return sections
}

const GRADE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: '최고의 길몽' },
  B: { bg: 'bg-blue-500',    text: 'text-blue-600',    label: '좋은 길몽' },
  C: { bg: 'bg-amber-400',   text: 'text-amber-500',   label: '평범한 꿈' },
  D: { bg: 'bg-orange-400',  text: 'text-orange-500',  label: '주의가 필요한 꿈' },
  E: { bg: 'bg-red-400',     text: 'text-red-500',     label: '흉몽의 기운' },
  F: { bg: 'bg-gray-400',    text: 'text-gray-500',    label: '해석 불가' },
}

const TYPE_STYLE: Record<string, string> = {
  길몽: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  흉몽: 'bg-red-50 text-red-500 border-red-200',
  중립: 'bg-gray-100 text-gray-500 border-gray-200',
}

export interface AnalysisResult {
  grade: string
  type: string
  title: string
  summary: string
  interpretation: string
  advice: string
  lucky_numbers: number[]
}

interface ResultModalProps {
  dream: string
  analysis: AnalysisResult
  onClose: () => void
}

export default function ResultModal({ dream, analysis, onClose }: ResultModalProps) {
  const router = useRouter()
  const gradeStyle = GRADE_STYLE[analysis.grade] ?? GRADE_STYLE['C']

  const [editedDream, setEditedDream] = useState(dream)
  const [title, setTitle]       = useState(analysis.title)
  const [category, setCategory] = useState('')
  const [price, setPrice]       = useState('5000')
  const [priceError, setPriceError] = useState('')
  const [saving, setSaving]         = useState(false)
  const [savingPrivate, setSavingPrivate] = useState(false)
  const [saveError, setSaveError]   = useState('')

  function validatePrice(val: number): string {
    if (!val || isNaN(val)) return '올바른 금액을 입력해주세요.'
    if (val < 5000)         return '최소 5,000P 이상 입력해주세요.'
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

  async function checkDailyLimit(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()
    const [dreamsRes, savedRes] = await Promise.all([
      supabase.from('dreams').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayISO),
      supabase.from('saved_dreams').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayISO),
    ])
    return ((dreamsRes.count ?? 0) + (savedRes.count ?? 0)) >= 3
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

    if (await checkDailyLimit(supabase, user.id)) {
      setSavingPrivate(false)
      setSaveError('오늘 꿈 등록 한도(하루 3개)에 도달했습니다. 내일 다시 시도해주세요.')
      return
    }

    await ensureProfile(supabase, user)

    const { error } = await supabase
      .from('saved_dreams')
      .insert({
        user_id:        user.id,
        title:          title.trim(),
        content:        editedDream.trim(),
        summary:        analysis.summary || editedDream.trim().slice(0, 100),
        grade:          analysis.grade,
        type:           analysis.type,
        interpretation: analysis.interpretation,
        advice:         analysis.advice,
        lucky_numbers:  analysis.lucky_numbers,
      })

    setSavingPrivate(false)
    if (error) { setSaveError(`저장 오류: ${error.message}`); return }

    onClose()
    router.push('/mypage')
    router.refresh()
  }

  async function handleRegister() {
    if (!title.trim()) { setSaveError('꿈 제목을 입력해주세요.'); return }
    if (!category)     { setSaveError('카테고리를 선택해주세요.'); return }
    const priceVal = Number(price)
    if (!price || priceVal < 5000)  { setSaveError('최소 5,000P 이상 입력해주세요.'); return }
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

    if (await checkDailyLimit(supabase, user.id)) {
      setSaving(false)
      setSaveError('오늘 꿈 등록 한도(하루 3개)에 도달했습니다. 내일 다시 시도해주세요.')
      return
    }

    await ensureProfile(supabase, user)

    const { data: inserted, error } = await supabase
      .from('dreams')
      .insert({
        user_id:        user.id,
        title:          title.trim(),
        content:        editedDream.trim(),
        summary:        analysis.summary || editedDream.trim().slice(0, 100),
        grade:          analysis.grade,
        dream_type:     analysis.type,
        interpretation: analysis.interpretation,
        advice:         analysis.advice,
        category:       category || 'etc',
        price:          Number(price),
        lucky_numbers:  analysis.lucky_numbers,
      })
      .select('id')
      .single()

    setSaving(false)

    if (error) {
      setSaveError(`등록 오류: ${error.message}`)
      return
    }

    onClose()
    router.push('/mypage')
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <div className="relative max-h-[90vh] w-full max-w-lg md:max-w-[800px] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* X 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          aria-label="닫기"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-7">

          {/* 모달 제목 */}
          <h2 className="mb-6 text-center text-xl font-black text-brand-heading">
            길몽상점 감정 결과
          </h2>

          {/* 등급 + 유형 */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${gradeStyle.bg} shadow-lg`}>
              <span className="text-5xl font-black text-white">{analysis.grade}</span>
            </div>
            <span className={`text-base font-bold ${gradeStyle.text}`}>{gradeStyle.label}</span>
            <span className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${TYPE_STYLE[analysis.type] ?? TYPE_STYLE['중립']}`}>
              {analysis.type}
            </span>
          </div>

          <hr className="mb-6 border-brand-border" />

          {/* 나의 꿈 기록 */}
          <section className="mb-6">
            <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">
              나의 꿈 기록 (원문)
              <span className="ml-2 text-xs font-normal text-gray-400">직접 수정 가능</span>
            </h3>
            <textarea
              value={editedDream}
              onChange={(e) => setEditedDream(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl bg-brand-page px-4 py-3 text-sm leading-relaxed text-brand-body outline-none focus:ring-1 focus:ring-[#01273A]"
            />
          </section>

          {/* 해몽 요약 */}
          {analysis.summary && (
            <section className="mb-5">
              <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">해몽 요약</h3>
              <div className="rounded-xl border border-[#CCCCCC] bg-amber-50/30 p-4 text-sm leading-relaxed text-brand-body">
                {analysis.summary}
              </div>
            </section>
          )}

          {/* 상세 해몽 */}
          {analysis.interpretation && (() => {
            const sections = parseInterpretation(analysis.interpretation)
            return (
              <section className="mb-5">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">상세 해몽</h3>
                <div className="rounded-xl border border-[#CCCCCC] overflow-hidden">
                  {sections.length > 0 ? sections.map((sec, i) => (
                    <div key={i}>
                      {i > 0 && <hr style={{ borderColor: '#EEEEEE' }} />}
                      <div className="p-4">
                        <p className="mb-1.5 text-sm font-bold" style={{ color: sec.color }}>{sec.title}</p>
                        <p className="text-sm leading-relaxed text-brand-body whitespace-pre-line">{sec.content}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-sm leading-relaxed text-brand-body whitespace-pre-line">
                      {analysis.interpretation}
                    </div>
                  )}
                </div>
              </section>
            )
          })()}

          {/* 실생활 조언 */}
          {analysis.advice && (
            <section className="mb-6">
              <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">실생활 조언</h3>
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm leading-relaxed text-brand-body">
                {analysis.advice}
              </div>
            </section>
          )}

          {/* 행운의 추천 번호 */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-muted">행운의 추천 번호</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.lucky_numbers.map((num) => (
                <div
                  key={num}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E07B2A] text-base font-black text-white shadow"
                >
                  {num}
                </div>
              ))}
            </div>
          </section>

          <hr className="mb-6 border-brand-border" />

          {/* 마켓 판매 등록 */}
          <section>
            <h3 className="mb-4 text-base font-black text-brand-heading">마켓 판매 등록</h3>

            <div className="mb-3">
              <label className="mb-1 block text-base font-medium text-brand-body">꿈 제목 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="꿈을 한 줄로 표현해주세요"
                className="w-full rounded-xl border border-[#CCCCCC] bg-white px-4 py-3 text-base text-brand-heading outline-none focus:border-[#01273A]"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-base font-medium text-brand-body">카테고리 <span className="text-red-400">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#CCCCCC] bg-white px-4 py-3 text-base text-brand-heading outline-none"
              >
                <option value="">카테고리를 선택해주세요</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="mb-1 block text-base font-medium text-brand-body">감정가 <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  min="5000"
                  step="100"
                  className="w-full rounded-xl border border-[#CCCCCC] bg-white px-4 py-3 pr-10 text-base text-brand-heading outline-none focus:border-[#01273A]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">P</span>
              </div>
              {priceError && <p className="mt-1 text-xs text-red-500">{priceError}</p>}
            </div>

            {saveError && (
              <p className="mb-4 text-sm text-red-500">{saveError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRegister}
                disabled={saving || savingPrivate || !!priceError}
                className="flex-1 rounded-xl bg-[#01273A] py-3 text-base font-bold text-white transition-colors hover:brightness-90 disabled:opacity-60"
              >
                {saving ? '등록 중...' : '마켓에 등록하기'}
              </button>
              <button
                onClick={handlePrivateSave}
                disabled={saving || savingPrivate}
                className="flex-1 rounded-xl border-2 border-[#01273A] bg-white py-3 text-base font-bold text-[#01273A] transition-colors hover:bg-[#01273A] hover:text-white disabled:opacity-60"
              >
                {savingPrivate ? '저장 중...' : '개인 저장'}
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border-2 border-gray-300 px-5 py-3 text-base font-bold text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
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
