'use client'

import { Suspense, useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'
import { loginAction } from '@/app/actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const resetDone = searchParams.get('reset') === 'done'

  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [saveId, setSaveId] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('savedUsername')
    if (saved) {
      setUsername(saved)
      setSaveId(true)
    }
  }, [])

  function handleBeforeSubmit() {
    if (saveId) {
      localStorage.setItem('savedUsername', username.trim().toLowerCase())
    } else {
      localStorage.removeItem('savedUsername')
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center text-2xl text-[#01273A]">로그인</h1>
      <p className="mb-6 text-center text-sm text-[#777777]">길몽상점에 오신 것을 환영합니다</p>

      {resetDone && (
        <div className="mb-6 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
        </div>
      )}

      <form action={formAction} onSubmit={handleBeforeSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-[#555555]">아이디</label>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디 입력"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#555555]">비밀번호</label>
          <input
            type="password"
            name="password"
            placeholder="비밀번호 입력"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={saveId}
            onChange={(e) => setSaveId(e.target.checked)}
            className="h-4 w-4 accent-[#01273A]"
          />
          <span className="text-sm text-[#555555]">아이디 저장</span>
        </label>

        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
        >
          {isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href="/auth/reset-password" className="text-sm text-[#777777] underline underline-offset-2 hover:text-[#01273A]">
          비밀번호를 잊으셨나요?
        </a>
      </div>

      <p className="mt-4 text-center text-sm text-[#777777]">
        아직 계정이 없으신가요?{' '}
        <a href="/auth/signup" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
          회원가입
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
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
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  )
}
