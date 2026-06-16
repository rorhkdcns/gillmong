'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@gillmong.com`
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-[#555555]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]'

export default function SignupPage() {
  const router = useRouter()
  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [nickname,  setNickname]  = useState('')
  const [realName,  setRealName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('아이디는 영문·숫자·밑줄(_) 3~20자로 입력해주세요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상 입력해주세요.')
      return
    }
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }
    if (!realName.trim()) {
      setError('이름(실명)을 입력해주세요.')
      return
    }
    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.')
      return
    }
    if (!/^[0-9\-+\s]{7,15}$/.test(phone)) {
      setError('전화번호 형식이 올바르지 않습니다.')
      return
    }
    if (!email.trim()) {
      setError('이메일 주소를 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('이메일 형식이 올바르지 않습니다.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const authEmail = usernameToEmail(username)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        data: {
          username:  username.trim().toLowerCase(),
          nickname:  nickname.trim(),
          real_name: realName.trim(),
          phone:     phone.trim(),
          email:     email.trim(),
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
        setError('이미 사용 중인 아이디입니다.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      return
    }

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

            <Field label="아이디" required>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="영문·숫자·밑줄 3~20자"
                required
                className={INPUT}
              />
              <p className="mt-1 text-xs text-gray-400">로그인에 사용됩니다 (영문·숫자·밑줄만 허용)</p>
            </Field>

            <Field label="비밀번호" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자리 이상"
                required
                minLength={6}
                className={INPUT}
              />
            </Field>

            <Field label="닉네임" required>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="다른 사용자에게 표시될 이름"
                required
                className={INPUT}
              />
            </Field>

            <Field label="이름 (실명)" required>
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="홍길동"
                required
                className={INPUT}
              />
            </Field>

            <Field label="전화번호" required>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                required
                className={INPUT}
              />
            </Field>

            <Field label="이메일 주소" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className={INPUT}
              />
            </Field>

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
