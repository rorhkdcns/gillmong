'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DbDream } from '@/lib/supabase/types'
import { CATEGORY_PATH } from '@/lib/supabase/types'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Script from 'next/script'
import { purchaseDream, deleteDream } from '../actions'
import ReportModal from './ReportModal'

const PAY_METHODS = [
  { id: 'card',           label: '신용·체크카드', desc: '국내외 모든 카드' },
  { id: 'vbank',          label: '가상계좌',        desc: '72시간 내 입금' },
  { id: 'kakaopay',       label: '카카오페이',      desc: 'Kakao Pay' },
  { id: 'naverpayCard',   label: '네이버페이',      desc: 'Naver Pay' },
  { id: 'samsungpayCard', label: '삼성페이',        desc: 'Samsung Pay' },
] as const
type PayMethodId = typeof PAY_METHODS[number]['id']

declare global {
  interface Window {
    AUTHNICE?: { requestPay: (config: Record<string, unknown>) => void }
  }
}

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

interface Props {
  dream: DbDream
  isOwner: boolean
  isPurchased: boolean
  nickname?: string
  isAdmin?: boolean
  isLoggedIn?: boolean
}

export default function DreamDetail({ dream, isOwner, isPurchased: initialPurchased, nickname, isAdmin, isLoggedIn }: Props) {
  const router = useRouter()
  const [showModal, setShowModal]         = useState(false)
  const [purchased, setPurchased]         = useState(initialPurchased || isOwner || !!isAdmin)
  const [showReport, setShowReport]       = useState(false)
  const [buying, setBuying]               = useState(false)
  const [buyError, setBuyError]           = useState('')
  const [myPoints, setMyPoints]           = useState<number | null>(null)
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting]               = useState(false)
  const [deleteError, setDeleteError]         = useState('')
  const [payMethod, setPayMethod]             = useState<PayMethodId>('card')
  const [payStep, setPayStep]                 = useState<'method' | 'confirm'>('method')

  const categoryPath = CATEGORY_PATH[dream.category] ?? '/'
  const afterBalance = myPoints !== null ? myPoints - dream.price : null
  const gradeStyle   = GRADE_STYLE[dream.grade] ?? GRADE_STYLE['C']
  const sections     = dream.interpretation ? parseInterpretation(dream.interpretation) : []
  const hasAnalysis  = !!(dream.dream_type || dream.interpretation || dream.advice)

  async function openPurchaseModal() {
    setLoadingPoints(true)
    setBuyError('')
    setPayStep('method')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoadingPoints(false); router.push('/auth/login'); return }
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
    setMyPoints(profile?.points ?? 0)
    setLoadingPoints(false)
    setShowModal(true)
  }

  async function handleNicepayPurchase() {
    if (!window.AUTHNICE) { setBuyError('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return }
    setBuying(true)
    setBuyError('')
    try {
      const res = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dreamId: dream.id, paymentMethod: payMethod }),
      })
      const pd = await res.json()
      if (!res.ok) throw new Error(pd.error ?? '주문 준비 실패')

      const config: Record<string, unknown> = {
        clientId:   process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID ?? 'R2_017e98e61ba345f298d6b497b6c52afa',
        method:     payMethod,
        orderId:    pd.orderId,
        amount:     pd.amount,
        goodsName:  pd.goodsName,
        returnUrl:  pd.returnUrl,
        buyerName:  pd.buyerName,
        buyerEmail: pd.buyerEmail,
        fnError: (result: { errorMsg?: string }) => {
          console.error('[Purchase] 결제창 오류/취소:', result)
          setBuyError(result.errorMsg ?? '결제 중 오류가 발생했습니다.')
          setBuying(false)
        },
      }

      if (payMethod === 'vbank') {
        config.vbankHolder     = '길몽상점'
        config.vbankValidHours = 72
      }

      window.AUTHNICE.requestPay(config)
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : '오류 발생')
      setBuying(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    const result = await deleteDream(dream.id)
    setDeleting(false)
    if (result.error) { setDeleteError(result.error); return }
    router.push(categoryPath)
  }

  async function handlePurchase() {
    setBuying(true)
    setBuyError('')
    let result: Awaited<ReturnType<typeof purchaseDream>>
    try {
      result = await purchaseDream(dream.id, dream.price)
    } catch {
      setBuyError('서버 연결 오류가 발생했습니다.')
      setBuying(false)
      return
    }
    setBuying(false)
    if (result.error) { setBuyError(result.error); return }
    setShowModal(false)
    setPurchased(true)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <Script src="https://pay.nicepay.co.kr/v1/js/" strategy="lazyOnload" />
      <SiteHeader />

      {/* 뒤로가기 */}
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="mx-auto max-w-[800px]">
          <a href={categoryPath} className="inline-flex items-center gap-1 text-sm text-[#777777] hover:text-[#01273A]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </a>
        </div>
      </div>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

            {/* 1. 등급 원형 + 등급 설명 + 유형 뱃지 */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full ${gradeStyle.bg} shadow-lg`}>
                <span className="text-5xl font-black text-white">{dream.grade}</span>
              </div>
              <span className={`text-base font-bold ${gradeStyle.text}`}>{gradeStyle.label}</span>
              <span className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${TYPE_STYLE[dream.dream_type] ?? TYPE_STYLE['중립']}`}>
                {dream.dream_type || '중립'}
              </span>
            </div>

            {/* 2. 꿈 제목 + 작성자 닉네임 */}
            <h1 className="mb-2 text-center text-2xl font-black leading-snug text-[#01273A]">{dream.title}</h1>
            {nickname && (
              <p className="mb-6 text-center text-sm text-gray-400">@{nickname}</p>
            )}

            <hr className="mb-6 border-brand-border" />

            {/* 3. 나의 꿈 기록 (원문) - 비구매시 블러 */}
            <section className="mb-6">
              <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">나의 꿈 기록 (원문)</h3>
              <div className="relative">
                <div className={`min-h-[80px] rounded-xl bg-brand-page p-4 text-sm leading-relaxed text-brand-body ${!purchased ? 'select-none blur-sm' : ''}`}>
                  {dream.content}
                </div>
                {!purchased && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl">
                    {isLoggedIn ? (
                      <>
                        <p className="text-sm font-semibold text-[#01273A]">구매 후 열람 가능합니다</p>
                        {!dream.is_sold ? (
                          <button
                            onClick={openPurchaseModal}
                            disabled={loadingPoints}
                            className="rounded-full bg-[#E07B2A] px-5 py-2 text-sm font-bold text-white hover:brightness-90 disabled:opacity-60"
                          >
                            {loadingPoints ? '잠시만요...' : `${dream.price.toLocaleString()} P 구매하기`}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">판매 완료된 꿈입니다</span>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#01273A]">로그인 후 구매 가능합니다</p>
                        <a href="/auth/login" className="rounded-full bg-[#01273A] px-5 py-2 text-sm font-bold text-white hover:brightness-90">
                          로그인하기
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 4. 해몽 요약 - 항상 공개 */}
            {dream.summary && (
              <section className="mb-5">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">해몽 요약</h3>
                <div className="rounded-xl border border-[#CCCCCC] bg-amber-50/30 p-4 text-sm leading-relaxed text-brand-body">
                  {dream.summary}
                </div>
              </section>
            )}

            {/* 5. 상세 해몽 - 비구매시 블러 */}
            <section className="mb-5">
              <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">상세 해몽</h3>
              {hasAnalysis && dream.interpretation ? (
                <div className="relative">
                  <div className={`rounded-xl border border-[#CCCCCC] overflow-hidden ${!purchased ? 'select-none blur-sm' : ''}`}>
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
                        {dream.interpretation}
                      </div>
                    )}
                  </div>
                  {!purchased && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl">
                      {isLoggedIn ? (
                        <>
                          <p className="text-sm font-semibold text-[#01273A]">구매 후 열람 가능합니다</p>
                          {!dream.is_sold ? (
                            <button
                              onClick={openPurchaseModal}
                              disabled={loadingPoints}
                              className="rounded-full bg-[#E07B2A] px-5 py-2 text-sm font-bold text-white hover:brightness-90 disabled:opacity-60"
                            >
                              {loadingPoints ? '잠시만요...' : `${dream.price.toLocaleString()} P 구매하기`}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">판매 완료된 꿈입니다</span>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#01273A]">로그인 후 구매 가능합니다</p>
                          <a href="/auth/login" className="rounded-full bg-[#01273A] px-5 py-2 text-sm font-bold text-white hover:brightness-90">
                            로그인하기
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">이 꿈은 감정 분석 데이터가 없습니다.</p>
              )}
            </section>

            {/* 6. 실생활 조언 - 비구매시 블러 */}
            <section className="mb-6">
              <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">실생활 조언</h3>
              {hasAnalysis && dream.advice ? (
                <div className="relative">
                  <div className={`rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm leading-relaxed text-brand-body ${!purchased ? 'select-none blur-sm' : ''}`}>
                    {dream.advice}
                  </div>
                  {!purchased && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl">
                      {isLoggedIn ? (
                        <>
                          <p className="text-sm font-semibold text-[#01273A]">구매 후 열람 가능합니다</p>
                          {!dream.is_sold ? (
                            <button
                              onClick={openPurchaseModal}
                              disabled={loadingPoints}
                              className="rounded-full bg-[#E07B2A] px-5 py-2 text-sm font-bold text-white hover:brightness-90 disabled:opacity-60"
                            >
                              {loadingPoints ? '잠시만요...' : `${dream.price.toLocaleString()} P 구매하기`}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">판매 완료된 꿈입니다</span>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#01273A]">로그인 후 구매 가능합니다</p>
                          <a href="/auth/login" className="rounded-full bg-[#01273A] px-5 py-2 text-sm font-bold text-white hover:brightness-90">
                            로그인하기
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">이 꿈은 감정 분석 데이터가 없습니다.</p>
              )}
            </section>

            {/* 7. 행운의 추천 번호 6개 - 항상 공개 */}
            {dream.lucky_numbers?.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-muted">행운의 추천 번호</h3>
                <div className="flex flex-wrap gap-2">
                  {dream.lucky_numbers.map((num) => (
                    <div key={num} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E07B2A] text-base font-black text-white shadow">
                      {num}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <hr className="mb-6 border-brand-border" />

            {/* 8. 감정가 */}
            <div className="mb-6 flex flex-col items-center gap-4 rounded-xl bg-brand-page px-6 py-6">
              <div className="flex flex-col items-center">
                <span className="mb-1 text-sm font-semibold text-[#555555]">감정가</span>
                <span className="text-3xl font-black text-[#E07B2A]">{dream.price.toLocaleString()} P</span>
              </div>
              {dream.is_sold && !purchased && (
                <span className="rounded-full bg-gray-400 px-5 py-1.5 text-sm font-bold text-white">판매완료</span>
              )}
              {!purchased && !dream.is_sold && isLoggedIn && (
                <button
                  onClick={openPurchaseModal}
                  disabled={loadingPoints}
                  className="rounded-full bg-[#E07B2A] px-8 py-2.5 text-base font-bold text-white hover:brightness-90 disabled:opacity-60"
                >
                  {loadingPoints ? '잠시만요...' : '구매하기'}
                </button>
              )}
              {!purchased && !dream.is_sold && !isLoggedIn && (
                <a href="/auth/login" className="rounded-full bg-[#01273A] px-8 py-2.5 text-base font-bold text-white hover:brightness-90">
                  로그인 후 구매하기
                </a>
              )}
            </div>

            {/* 수정/삭제 (본인 + 미판매) */}
            {isOwner && !dream.is_sold && (
              <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
                <button
                  onClick={() => router.push(`/dream/${dream.id}/edit`)}
                  className="text-sm text-[#777777] transition-colors hover:text-[#333333]"
                >
                  수정
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => { setShowDeleteModal(true); setDeleteError('') }}
                  className="text-sm text-[#777777] transition-colors hover:text-red-400"
                >
                  삭제
                </button>
              </div>
            )}

            {/* 신고하기 (비로그인 제외, 본인/관리자 제외) */}
            {isLoggedIn && !isOwner && !isAdmin && (
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowReport(true)}
                  className="text-xs text-gray-400 transition-colors hover:text-red-400"
                >
                  신고하기
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      <SiteFooter />

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setDeleteError('') } }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-center text-xl text-[#01273A]">꿈 삭제</h2>
            <p className="mb-6 text-center text-[#555555]">
              <span className="font-semibold text-[#01273A]">"{dream.title}"</span>을(를)<br />
              정말 삭제하시겠습니까?<br />
              <span className="text-sm text-[#999]">삭제 후에는 복구할 수 없습니다.</span>
            </p>
            {deleteError && <p className="mb-4 text-center text-sm text-red-500">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError('') }}
                disabled={deleting}
                className="flex-1 border border-gray-300 py-3 text-[#555555] transition-colors hover:border-[#01273A] hover:text-[#01273A]"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {showReport && (
        <ReportModal dreamId={dream.id} onClose={() => setShowReport(false)} />
      )}

      {/* 구매 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setBuyError('') } }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            {/* 꿈 정보 요약 */}
            <div className="mb-4 rounded-xl bg-[#F7F7F5] p-4">
              <p className="mb-0.5 text-xs text-[#777777]">구매할 꿈</p>
              <p className="mb-2 font-semibold text-[#01273A] text-sm">{dream.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#777777]">결제금액</span>
                <span className="text-base font-bold text-[#E07B2A]">₩{dream.price.toLocaleString()}</span>
              </div>
            </div>

            {payStep === 'method' ? (
              <>
                <h2 className="mb-3 text-base font-bold text-[#01273A]">결제수단 선택</h2>

                {/* 포인트 결제 (보유 포인트 있을 때만) */}
                {myPoints !== null && myPoints >= dream.price && (
                  <div className="mb-3">
                    <button
                      onClick={() => setPayStep('confirm')}
                      className="w-full rounded-xl border-2 border-[#E07B2A] bg-orange-50 px-4 py-3 text-left transition hover:bg-orange-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#E07B2A]">포인트로 결제</p>
                          <p className="text-xs text-gray-500">보유: {myPoints.toLocaleString()} P (즉시 확정)</p>
                        </div>
                        <span className="text-xs bg-[#E07B2A] text-white rounded-full px-2 py-0.5">추천</span>
                      </div>
                    </button>
                    <div className="my-3 flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400">또는</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                  </div>
                )}

                {/* NicePay 결제수단 */}
                <div className="space-y-2">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${
                        payMethod === m.id
                          ? 'border-[#01273A] bg-[#01273A]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${payMethod === m.id ? 'text-[#01273A]' : 'text-gray-700'}`}>{m.label}</p>
                        <p className="text-xs text-gray-400">{m.desc}</p>
                      </div>
                      {payMethod === m.id && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#01273A]">
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {buyError && <p className="mt-3 text-center text-sm text-red-500">{buyError}</p>}

                <p className="mt-3 text-center text-xs text-gray-400">
                  결제 후 7일 내 구매확정 또는 환불요청 가능 · 7일 경과 시 자동 정산
                </p>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => { setShowModal(false); setBuyError('') }}
                    disabled={buying}
                    className="flex-1 border border-gray-300 py-3 text-sm text-[#555555] transition-colors hover:border-[#01273A] hover:text-[#01273A]"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleNicepayPurchase}
                    disabled={buying}
                    className="flex-1 rounded-xl bg-[#01273A] py-3 text-sm font-semibold text-white transition-all hover:brightness-90 disabled:opacity-50"
                  >
                    {buying ? '처리 중...' : `${PAY_METHODS.find(m => m.id === payMethod)?.label ?? ''} 결제`}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 포인트 결제 확인 단계 */}
                <h2 className="mb-4 text-center text-base font-bold text-[#01273A]">포인트 결제 확인</h2>
                <div className="mb-4 space-y-2 rounded-xl border border-gray-100 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#777777]">내 포인트 잔액</span>
                    <span className="font-semibold text-[#333333]">{myPoints?.toLocaleString() ?? '-'} P</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#777777]">결제 후 잔액</span>
                    <span className="font-semibold text-[#333333]">
                      {afterBalance !== null ? afterBalance.toLocaleString() : '-'} P
                    </span>
                  </div>
                </div>
                <p className="mb-4 text-center text-xs text-[#999]">포인트 결제는 즉시 구매확정 처리됩니다.</p>
                {buyError && <p className="mb-3 text-center text-sm text-red-500">{buyError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPayStep('method'); setBuyError('') }}
                    disabled={buying}
                    className="flex-1 border border-gray-300 py-3 text-sm text-[#555555] transition-colors hover:border-[#01273A] hover:text-[#01273A]"
                  >
                    뒤로
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={buying}
                    className="flex-1 rounded-xl bg-[#E07B2A] py-3 text-sm font-semibold text-white transition-all hover:brightness-90 disabled:opacity-50"
                  >
                    {buying ? '처리 중...' : '포인트로 구매'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
