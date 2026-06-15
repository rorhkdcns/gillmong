'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@gillmong.com`
}

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('아이디는 영문·숫자·밑줄(_) 3~20자로 입력해주세요.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const email = usernameToEmail(username)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim().toLowerCase(),
          nickname: nickname.trim(),
        },
      },
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('이미 사용 중인 아이디입니다.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      return
    }

    // 이메일 인증 OFF 상태면 session 즉시 반환 → 마이페이지로 이동
    if (data.session) {
      router.push('/mypage')
      router.refresh()
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F5] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center bg-[#01273A]">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mb-3 text-2xl text-[#01273A]">가입 완료!</h2>
          <p className="mb-8 text-sm text-[#777777]">바로 로그인하실 수 있습니다.</p>
          <a
            href="/auth/login"
            className="inline-block w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90"
          >
            로그인하러 가기
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
          <h1 className="mb-2 text-center text-2xl text-[#01273A]">회원가입</h1>
          <p className="mb-10 text-center text-sm text-[#777777]">길몽상점과 함께 꿈을 거래해보세요</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm text-[#555555]">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="영문·숫자·밑줄 3~20자"
                required
                className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-[#555555]">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="표시될 이름"
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
                placeholder="6자리 이상"
                required
                minLength={6}
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
              {loading ? '처리 중...' : '가입하기'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#777777]">
            이미 계정이 있으신가요?{' '}
            <a href="/auth/login" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
              로그인
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
