'use client'

import { Suspense, useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'
import { loginAction } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2C5.03 2 1 5.14 1 9c0 2.52 1.71 4.74 4.28 5.98-.14.5-.9 3.13-.93 3.32 0 0-.02.15.08.21.1.06.21.02.21.02.28-.04 3.24-2.13 3.75-2.48.51.07 1.04.11 1.61.11 4.97 0 9-3.14 9-7 0-3.86-4.03-7-9-7z"
        fill="black"
      />
    </svg>
  )
}

function NaverIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M13.5 2v8.5L6.5 2H2v16h4.5V9.5l7 8.5H18V2h-4.5z" fill="white" />
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const resetDone = searchParams.get('reset') === 'done'

  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [saveId, setSaveId] = useState(false)
  const [username, setUsername] = useState('')
  const [socialLoading, setSocialLoading] = useState<'kakao' | 'naver' | null>(null)

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

  async function handleSocialLogin(provider: 'kakao' | 'naver') {
    setSocialLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: provider === 'naver' ? 'custom:naver' : 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/mypage`,
      },
    })
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center text-2xl text-[#0B2433]">로그인</h1>
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
            className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#0B2433]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#555555]">비밀번호</label>
          <input
            type="password"
            name="password"
            placeholder="비밀번호 입력"
            required
            className="w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#0B2433]"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={saveId}
            onChange={(e) => setSaveId(e.target.checked)}
            className="h-4 w-4 accent-[#0B2433]"
          />
          <span className="text-sm text-[#555555]">아이디 저장</span>
        </label>

        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full bg-[#0B2433] py-3 text-base font-semibold text-white transition-all hover:brightness-90 disabled:opacity-60"
        >
          {isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-[#999999]">또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('kakao')}
          disabled={socialLoading !== null}
          className="flex w-full items-center justify-center gap-2 bg-[#FEE500] py-3 text-base font-semibold text-black transition-all hover:brightness-95 disabled:opacity-60"
        >
          <KakaoIcon />
          {socialLoading === 'kakao' ? '이동 중...' : '카카오로 로그인'}
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('naver')}
          disabled={socialLoading !== null}
          className="flex w-full items-center justify-center gap-2 bg-[#03C75A] py-3 text-base font-semibold text-white transition-all hover:brightness-95 disabled:opacity-60"
        >
          <NaverIcon />
          {socialLoading === 'naver' ? '이동 중...' : '네이버로 로그인'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <a href="/auth/reset-password" className="text-sm text-[#777777] underline underline-offset-2 hover:text-[#0B2433]">
          비밀번호를 잊으셨나요?
        </a>
      </div>

      <p className="mt-4 text-center text-sm text-[#777777]">
        아직 계정이 없으신가요?{' '}
        <a href="/auth/signup" className="text-[#0B2433] underline underline-offset-2 hover:brightness-75">
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
