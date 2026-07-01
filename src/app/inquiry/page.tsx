'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { submitInquiry } from './actions'

export default function InquiryPage() {
  const router = useRouter()
  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim())   { setError('제목을 입력해주세요.'); return }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return }

    setError('')
    setLoading(true)
    const result = await submitInquiry(title, content)
    setLoading(false)

    if (result.error) {
      if (result.error.includes('로그인')) {
        router.push('/auth/login')
        return
      }
      setError(result.error)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#01273A]">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-[#01273A]">문의가 접수되었습니다</h2>
            <p className="mb-8 text-sm text-[#777777]">영업일 기준 1~2일 내 답변드립니다.<br />마이페이지에서 답변 상태를 확인하실 수 있습니다.</p>
            <div className="flex gap-3">
              <a href="/mypage" className="flex-1 rounded-xl border border-[#01273A] py-3 text-sm font-semibold text-[#01273A] hover:bg-[#01273A] hover:text-white transition-colors text-center">
                마이페이지
              </a>
              <button
                onClick={() => { setDone(false); setTitle(''); setContent('') }}
                className="flex-1 rounded-xl bg-[#01273A] py-3 text-sm font-semibold text-white hover:brightness-90 transition-all"
              >
                추가 문의
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-[#01273A]">1:1 문의</h1>
            <p className="mt-2 text-sm text-gray-400">영업일 기준 1~2일 내에 답변드립니다</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#333333]">
                  제목 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError('') }}
                  placeholder="문의 제목을 입력해주세요"
                  maxLength={100}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-[#333333] outline-none focus:border-[#01273A] placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#333333]">
                  내용 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setError('') }}
                  placeholder="문의 내용을 자세히 적어주세요"
                  rows={8}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-[#333333] outline-none focus:border-[#01273A] placeholder:text-gray-300"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{content.length}/2000</p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#01273A] py-4 text-base font-bold text-white transition-all hover:brightness-90 disabled:opacity-60"
              >
                {loading ? '제출 중...' : '문의 제출하기'}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-700">
            <p className="font-semibold">📌 안내사항</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-600">
              <li>• 답변은 마이페이지 → 1:1 문의 내역에서 확인하실 수 있습니다.</li>
              <li>• 운영시간: 평일 10:00 ~ 18:00 (주말·공휴일 제외)</li>
              <li>• 긴급 문의: admin@gillmong.com</li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
