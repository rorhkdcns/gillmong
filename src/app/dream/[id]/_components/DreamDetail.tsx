'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DbDream } from '@/lib/supabase/types'
import { CATEGORY_PATH } from '@/lib/supabase/types'
import SiteHeader from '@/components/SiteHeader'
import { purchaseDream, deleteDream } from '../actions'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
  F: 'bg-gray-400',
}

interface Props {
  dream: DbDream
  isOwner: boolean
  isPurchased: boolean
}

export default function DreamDetail({ dream, isOwner, isPurchased: initialPurchased }: Props) {
  const router = useRouter()
  const [showModal, setShowModal]   = useState(false)
  const [purchased, setPurchased]   = useState(initialPurchased || isOwner)
  const [buying, setBuying]         = useState(false)
  const [buyError, setBuyError]     = useState('')
  const [myPoints, setMyPoints]     = useState<number | null>(null)
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [deleteError, setDeleteError]       = useState('')

  const categoryPath = CATEGORY_PATH[dream.category] ?? '/'
  const afterBalance = myPoints !== null ? myPoints - dream.price : null

  async function openPurchaseModal() {
    setLoadingPoints(true)
    setBuyError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoadingPoints(false)
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single()

    setMyPoints(profile?.points ?? 0)
    setLoadingPoints(false)
    setShowModal(true)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    const result = await deleteDream(dream.id)
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    router.push(categoryPath)
  }

  async function handlePurchase() {
    setBuying(true)
    setBuyError('')

    console.log('[DreamDetail] 구매 시작 — dreamId:', dream.id, 'price:', dream.price)

    let result: Awaited<ReturnType<typeof purchaseDream>>
    try {
      result = await purchaseDream(dream.id, dream.price)
    } catch (e) {
      console.error('[DreamDetail] Server Action 호출 자체 실패:', e)
      setBuyError('서버 연결 오류가 발생했습니다.')
      setBuying(false)
      return
    }

    console.log('[DreamDetail] 구매 결과:', result)

    setBuying(false)

    if (result.error) {
      console.error('[DreamDetail] ❌ 구매 실패:', result.error, '\ndebug:', result.debug)
      setBuyError(result.error)
      return
    }

    console.log('[DreamDetail] ✅ 구매 성공')
    setShowModal(false)
    setPurchased(true)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      {/* 뒤로가기 */}
      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="mx-auto max-w-2xl">
          <a href={categoryPath} className="inline-flex items-center gap-1 text-sm text-[#777777] hover:text-[#01273A]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </a>
        </div>
      </div>

      {/* 본문 */}
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="border border-gray-200 bg-white p-8 shadow-sm">

            {/* 등급 원형 */}
            <div className="mb-6 flex justify-center">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white shadow-lg ${GRADE_COLOR[dream.grade] ?? 'bg-gray-400'}`}>
                {dream.grade}
              </div>
            </div>

            {/* 제목 */}
            <h1 className="mb-8 text-center text-2xl leading-snug text-[#01273A]">{dream.title}</h1>

            <hr className="mb-8 border-gray-100" />

            {/* 꿈 요약 */}
            <div className="mb-8">
              <div className="mb-4 inline-block bg-[#6B96A8] px-4 py-2">
                <span className="text-base font-semibold text-white">꿈 요약</span>
              </div>
              <p className="leading-relaxed text-[#333333]">{dream.summary}</p>
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* 행운의 번호 */}
            <div className="mb-6">
              <div className="mb-4 inline-block bg-[#6B96A8] px-4 py-2">
                <span className="text-base font-semibold text-white">행운의 번호</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {dream.lucky_numbers.map((num) => (
                  <div key={num} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E07B2A] text-base font-bold text-white shadow">
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* 감정가 */}
            <div className="mb-4 flex flex-col items-center justify-center bg-[#F7F7F5] px-6 py-6">
              <span className="mb-1 text-base font-semibold text-[#555555]">감정가</span>
              <span className="font-bold text-[#E07B2A]" style={{ fontSize: '28px' }}>{dream.price.toLocaleString()} P</span>
            </div>

            {/* 원문 영역 */}
            <div className="mb-8">
              <div className="relative overflow-hidden border border-gray-200">
                <div className={`min-h-48 p-6 ${!purchased ? 'pointer-events-none select-none blur-sm' : ''}`}>
                  <p className="leading-relaxed text-[#555555]">{dream.content}</p>
                </div>
                {!purchased && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
                    {dream.is_sold ? (
                      <>
                        <span className="mb-4 rounded-full bg-gray-400 px-5 py-1.5 text-sm font-bold text-white">판매완료</span>
                        <p className="text-[#777777]">이미 다른 분이 구매한 꿈입니다</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-5 text-[#555555]">꿈의 이야기는 구매 후 열람이 가능합니다</p>
                        <button
                          onClick={openPurchaseModal}
                          disabled={loadingPoints}
                          className="bg-[#01273A] px-8 py-3 font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
                        >
                          {loadingPoints ? '잔액 확인 중...' : '구매하기'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 수정/삭제 (본인 + 미판매 꿈만) */}
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

          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-1 text-[#555555]">
            <span>대표: 홍길몽</span>
            <span>사업자등록번호: 000-00-00000</span>
            <span>통신판매업신고: 제2024-서울-00000호</span>
            <span>주소: 서울특별시 강남구 테헤란로 123</span>
            <span className="mt-2">고객센터: 1588-0000 · 평일 10:00 – 18:00 (점심 12:00–13:00, 주말·공휴일 휴무)</span>
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <div className="flex flex-wrap gap-5 text-[#555555]">
              {[
                { label: '이용약관',        href: '/terms' },
                { label: '개인정보처리방침', href: '/privacy' },
                { label: '이용안내',        href: '/guide' },
                { label: '제휴문의',        href: '#' },
              ].map(({ label, href }) => (
                <a key={label} href={href} className="hover:underline">{label}</a>
              ))}
            </div>
            <p className="text-gray-400">© 2024 길몽상점. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setDeleteError('') } }}
        >
          <div className="w-full max-w-sm bg-white p-8 shadow-2xl">
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
                className="flex-1 bg-red-500 py-3 font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구매 확인 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setBuyError('') } }}
        >
          <div className="w-full max-w-sm bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-xl text-[#01273A]">구매 확인</h2>

            {/* 꿈 정보 */}
            <div className="mb-5 bg-[#F7F7F5] p-5">
              <p className="mb-1 text-sm text-[#777777]">구매할 꿈</p>
              <p className="mb-3 font-semibold text-[#01273A]">{dream.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#777777]">감정가</span>
                <span className="text-lg font-bold text-[#E07B2A]">{dream.price.toLocaleString()} P</span>
              </div>
            </div>

            {/* 잔액 정보 */}
            <div className="mb-6 space-y-2 border border-gray-100 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#777777]">내 포인트 잔액</span>
                <span className="font-semibold text-[#333333]">{myPoints?.toLocaleString() ?? '-'} P</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777777]">구매 후 잔액</span>
                <span className={`font-semibold ${afterBalance !== null && afterBalance < 0 ? 'text-red-500' : 'text-[#333333]'}`}>
                  {afterBalance !== null ? afterBalance.toLocaleString() : '-'} P
                </span>
              </div>
            </div>

            {afterBalance !== null && afterBalance < 0 && (
              <p className="mb-4 rounded bg-red-50 px-3 py-2 text-center text-sm text-red-500">
                포인트가 부족합니다. 충전 후 이용해주세요.
              </p>
            )}

            {buyError && <p className="mb-4 text-center text-sm text-red-500">{buyError}</p>}

            <p className="mb-5 text-center text-xs text-[#999]">구매 후에는 환불이 불가합니다.</p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setBuyError('') }}
                disabled={buying}
                className="flex-1 border border-gray-300 py-3 text-[#555555] transition-colors hover:border-[#01273A] hover:text-[#01273A]"
              >
                취소
              </button>
              <button
                onClick={handlePurchase}
                disabled={buying || (afterBalance !== null && afterBalance < 0)}
                className="flex-1 bg-[#01273A] py-3 font-semibold text-white transition-all hover:brightness-90 disabled:opacity-50"
              >
                {buying ? '처리 중...' : '구매하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
