'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@gillmong.com`
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetDone = searchParams.get('reset') === 'done'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [saveId, setSaveId]     = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('savedUsername')
    if (saved) {
      setUsername(saved)
      setSaveId(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (saveId) {
      localStorage.setItem('savedUsername', username.trim().toLowerCase())
    } else {
      localStorage.removeItem('savedUsername')
    }

    const supabase = createClient()
    const email = usernameToEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    router.push('/mypage')
    router.refresh()
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-[#555555]">아이디</label>
          <input
            type="text"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
        >
          {loading ? '로그인 중...' : '로그인'}
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
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
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
