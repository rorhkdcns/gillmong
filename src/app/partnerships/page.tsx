'use client'

import { useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { submitPartnershipInquiry } from './actions'

export default function PartnershipsPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', title: '', content: '' })
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.email.trim() || !form.title.trim() || !form.content.trim()) {
      setError('이름, 이메일, 제목, 내용은 필수 항목입니다.')
      return
    }
    setLoading(true)
    const result = await submitPartnershipInquiry({
      name:    form.name.trim(),
      email:   form.email.trim(),
      company: form.company.trim() || undefined,
      phone:   form.phone.trim()   || undefined,
      title:   form.title.trim(),
      content: form.content.trim(),
    })
    setLoading(false)
    if (result.error) { setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.'); return }
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      <section className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-[#01273A]">제휴문의</h1>
            <p className="mt-2 text-sm text-gray-500">길몽상점과의 제휴 및 협력 문의를 남겨주세요.</p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
              <p className="text-lg font-bold text-emerald-700">문의가 접수되었습니다</p>
              <p className="mt-2 text-sm text-emerald-600">입력하신 이메일로 검토 후 연락드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              {/* 이름 · 이메일 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#333]">이름 <span className="text-red-400">*</span></label>
                  <input name="name" value={form.name} onChange={change} placeholder="홍길동" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#333]">이메일 <span className="text-red-400">*</span></label>
                  <input name="email" value={form.email} onChange={change} type="email" placeholder="example@company.com" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]" />
                </div>
              </div>

              {/* 회사명 · 연락처 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#333]">회사명 <span className="text-xs font-normal text-gray-400">(선택)</span></label>
                  <input name="company" value={form.company} onChange={change} placeholder="(주)회사명" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#333]">연락처 <span className="text-xs font-normal text-gray-400">(선택)</span></label>
                  <input name="phone" value={form.phone} onChange={change} placeholder="010-0000-0000" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]" />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#333]">제목 <span className="text-red-400">*</span></label>
                <input name="title" value={form.title} onChange={change} placeholder="문의 제목을 입력하세요" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]" />
              </div>

              {/* 내용 */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#333]">내용 <span className="text-red-400">*</span></label>
                <textarea name="content" value={form.content} onChange={change} rows={6} placeholder="제휴 목적 및 문의 내용을 자세히 작성해주세요." className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#01273A]" />
              </div>

              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#01273A] py-3 text-sm font-bold text-white transition hover:brightness-90 disabled:opacity-60"
              >
                {loading ? '제출 중...' : '문의 제출하기'}
              </button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
