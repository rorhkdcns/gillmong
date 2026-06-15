'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [username, setUsername] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F5] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center bg-[#01273A]">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-4 text-2xl text-[#01273A]">관리자에게 문의해주세요</h2>
          <div className="mb-6 bg-white border border-gray-200 px-6 py-5 text-left">
            <p className="mb-1 text-sm text-[#777777]">문의 아이디</p>
            <p className="text-base text-[#333333]">{username}</p>
          </div>
          <p className="mb-2 text-sm text-[#555555]">고객센터로 연락하시면 비밀번호를 초기화해드립니다.</p>
          <p className="mb-8 text-sm font-semibold text-[#01273A]">1588-0000 · 평일 10:00 – 18:00</p>
          <a
            href="/auth/login"
            className="inline-block w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90"
          >
            로그인으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <a href="/">
            <Image src="/logo_1.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
          </a>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-center text-2xl text-[#01273A]">비밀번호 찾기</h1>
          <p className="mb-10 text-center text-sm text-[#777777]">아이디를 입력하면 관리자 문의 안내를 드립니다</p>

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

            <button
              type="submit"
              className="mt-2 w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90"
            >
              확인
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#777777]">
            <a href="/auth/login" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
              로그인으로 돌아가기
            </a>
          </p>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white px-6 py-6 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-400">© 2024 길몽상점. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
