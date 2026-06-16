'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DbDream } from '@/lib/supabase/types'
import { CATEGORY_PATH, CATEGORY_LABEL } from '@/lib/supabase/types'
import SiteHeader from '@/components/SiteHeader'
import { updateDream } from '../../actions'

interface Props {
  dream: DbDream
}

export default function DreamEditForm({ dream }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(dream.title)
  const [price, setPrice] = useState(String(dream.price))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [saved, setSaved]   = useState(false)

  const categoryPath = CATEGORY_PATH[dream.category] ?? '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedPrice = parseInt(price, 10)
    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('올바른 감정가를 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    const result = await updateDream(dream.id, {
      title: title.trim(),
      summary: dream.summary,
      content: dream.content,
      price: parsedPrice,
      category: dream.category,
    })
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    setTimeout(() => {
      router.push(`/dream/${dream.id}`)
      router.refresh()
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="mx-auto max-w-2xl">
          <a
            href={`/dream/${dream.id}`}
            className="inline-flex items-center gap-1 text-sm text-[#777777] hover:text-[#01273A]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            상세 페이지로
          </a>
        </div>
      </div>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-8 text-center text-2xl text-[#01273A]">꿈 수정</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#555555]">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-[#333333] outline-none focus:border-[#6B96A8]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#555555]">카테고리</label>
                <div className="w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#888888]">
                  {CATEGORY_LABEL[dream.category] ?? dream.category}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#555555]">꿈 요약</label>
                <div className="w-full resize-none border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-[#888888]">
                  {dream.summary}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#555555]">꿈 원문</label>
                <div className="w-full whitespace-pre-line border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-[#888888]">
                  {dream.content}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#555555]">감정가 (P)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min={1}
                  className="w-full border border-gray-200 px-4 py-3 text-[#333333] outline-none focus:border-[#6B96A8]"
                />
              </div>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              {saved && (
                <div className="flex items-center justify-center gap-2 rounded bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  저장되었습니다. 잠시 후 이동합니다…
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/dream/${dream.id}`)}
                  disabled={saving || saved}
                  className="flex-1 border border-gray-300 py-3 text-[#555555] transition-colors hover:border-[#01273A] hover:text-[#01273A] disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving || saved}
                  className="flex-1 bg-[#01273A] py-3 font-semibold text-white transition-all hover:brightness-90 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
