'use client'

import { useState } from 'react'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

export default function ResetPasswordPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [resetLink, setResetLink] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) {
      setError(data.error ?? '오류가 발생했습니다. 다시 시도해주세요.')
      return
    }

    setResetLink(data.link)
  }

  if (resetLink) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F5] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center bg-[#01273A]">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-3 text-2xl text-[#01273A]">비밀번호 재설정 링크</h2>
          <p className="mb-8 text-sm text-[#777777]">
            아래 버튼을 클릭해 새 비밀번호를 설정해주세요.<br />
            <span className="font-semibold text-[#555555]">링크는 1시간 내에 사용해야 합니다.</span>
          </p>
          <a
            href={resetLink}
            className="inline-block w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90"
          >
            비밀번호 재설정하기
          </a>
          <p className="mt-6 text-center text-sm text-[#777777]">
            <a href="/auth/login" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
              로그인으로 돌아가기
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <a href="/">
            <Image src="/logo_1.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-center text-2xl text-[#01273A]">비밀번호 찾기</h1>
          <p className="mb-10 text-center text-sm text-[#777777]">가입 시 등록한 아이디와 이메일을 입력해주세요</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm text-[#555555]">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="가입한 아이디"
                required
                className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-[#555555]">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입 시 등록한 이메일"
                required
                className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
            >
              {loading ? '확인 중...' : '확인'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#777777]">
            <a href="/auth/login" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
              로그인으로 돌아가기
            </a>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
