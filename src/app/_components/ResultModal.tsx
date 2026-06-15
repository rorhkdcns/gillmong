'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_DB } from '@/lib/supabase/types'

const CATEGORIES = ['인물·신체', '동물·식물', '자연·사물', '행동·상황', '기타']

const GRADE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: '최고의 길몽' },
  B: { bg: 'bg-blue-500',    text: 'text-blue-600',    label: '좋은 길몽' },
  C: { bg: 'bg-amber-400',   text: 'text-amber-500',   label: '평범한 꿈' },
  D: { bg: 'bg-orange-400',  text: 'text-orange-500',  label: '주의가 필요한 꿈' },
  E: { bg: 'bg-red-400',     text: 'text-red-500',     label: '흉몽의 기운' },
  F: { bg: 'bg-gray-400',    text: 'text-gray-500',    label: '해석 불가' },
}

const PLACEHOLDER_REPORT = `이 꿈은 무의식 깊은 곳에서 보내는 강력한 메시지입니다.

꿈속에 등장한 존재와 상황은 현재 당신이 직면한 내면의 갈등과 욕망을 상징합니다. 특히 꿈의 전개 방식은 당신이 현실에서 어떤 선택의 기로에 서 있음을 암시하며, 잠재의식이 그 해답을 이미 알고 있음을 보여줍니다.

가까운 미래에 예상치 못한 변화나 기회가 찾아올 가능성이 높습니다. 이 꿈은 그 변화를 준비하라는 신호로 해석됩니다. 두려움보다는 열린 마음으로 새로운 가능성을 받아들이는 것이 중요합니다.

대인관계에서는 신뢰할 수 있는 사람이 나타날 조짐이 보이며, 재물운 측면에서도 긍정적인 흐름이 감지됩니다.`

interface ResultModalProps {
  dream: string
  grade: string
  luckyNumbers: number[]
  onClose: () => void
}

export default function ResultModal({ dream, grade, luckyNumbers, onClose }: ResultModalProps) {
  const router = useRouter()
  const gradeStyle = GRADE_STYLE[grade]

  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice]       = useState('5000')
  const [priceError, setPriceError] = useState('')
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState('')

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

  async function handleRegister() {
    if (!title.trim()) { setSaveError('꿈 제목을 입력해주세요.'); return }
    if (!category)     { setSaveError('카테고리를 선택해주세요.'); return }
    const priceVal = Number(price)
    if (!price || priceVal < 5000)  { setSaveError('최소 5,000P 이상 입력해주세요.'); return }
    if (priceVal % 100 !== 0)       { setSaveError('판매금액은 100원 단위로 입력해주세요.'); return }

    setSaveError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      setSaveError('로그인이 필요합니다.')
      return
    }

    // profiles 행 확인 — 트리거가 안 탄 계정은 직접 생성
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      const username =
        (user.user_metadata?.username as string) ??
        user.email?.replace('@gillmong.com', '') ??
        user.id.slice(0, 8)
      const nickname =
        (user.user_metadata?.nickname as string) ?? username

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username, nickname })

      if (profileError) {
        console.error('[profiles insert]', profileError)
        setSaving(false)
        setSaveError(`프로필 생성 오류: ${profileError.message}`)
        return
      }
    }

    const summary = dream.trim().slice(0, 100) + (dream.length > 100 ? '...' : '')

    const { data: inserted, error } = await supabase
      .from('dreams')
      .insert({
        user_id:       user.id,
        title:         title.trim(),
        content:       dream.trim(),
        summary,
        grade,
        category:      CATEGORY_DB[category] ?? 'etc',
        price:         Number(price),
        lucky_numbers: luckyNumbers,
      })
      .select('id')
      .single()

    setSaving(false)

    if (error) {
      console.error('[dreams insert]', error)
      setSaveError(`등록 오류: ${error.message}`)
      return
    }

    onClose()
    router.push(`/dream/${inserted.id}?owner=1`)
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

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

          {/* 등급 */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${gradeStyle.bg} shadow-lg`}>
              <span className="text-5xl font-black text-white">{grade}</span>
            </div>
            <span className={`text-base font-bold ${gradeStyle.text}`}>{gradeStyle.label}</span>
          </div>

          <hr className="mb-6 border-brand-border" />

          {/* 나의 꿈 기록 */}
          <section className="mb-6">
            <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">나의 꿈 기록 (원문)</h3>
            <div className="rounded-xl bg-brand-page p-4 text-sm leading-relaxed text-brand-body">
              {dream}
            </div>
          </section>

          {/* 해몽 결과 */}
          <section className="mb-6">
            <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">해몽 결과</h3>
            <div className="rounded-xl border border-[#CCCCCC] p-4 text-sm leading-relaxed text-brand-body whitespace-pre-line">
              {PLACEHOLDER_REPORT}
            </div>
          </section>

          {/* 행운의 추천 번호 */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-muted">행운의 추천 번호</h3>
            <div className="flex flex-wrap gap-2">
              {luckyNumbers.map((num) => (
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
                  <option key={cat} value={cat}>{cat}</option>
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
                disabled={saving || !!priceError}
                className="flex-1 rounded-xl bg-[#01273A] py-3 text-base font-bold text-white transition-colors hover:brightness-90 disabled:opacity-60"
              >
                {saving ? '등록 중...' : '마켓에 등록하기'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-brand-dark py-3 text-base font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
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
