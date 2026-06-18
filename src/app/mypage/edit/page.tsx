'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SiteHeader from '@/components/SiteHeader'

export default function MyPageEdit() {
  const router = useRouter()
  const [nickname,    setNickname]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [nickError,   setNickError]   = useState('')
  const [pwError,     setPwError]     = useState('')
  const [nickDone,    setNickDone]    = useState(false)
  const [pwDone,      setPwDone]      = useState(false)
  const [loadingNick, setLoadingNick] = useState(false)
  const [loadingPw,   setLoadingPw]   = useState(false)
  const [initDone,    setInitDone]    = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
      if (profile) setNickname(profile.nickname)
      setInitDone(true)
    })
  }, [router])

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setNickError('닉네임을 입력해주세요.'); return }
    setNickError('')
    setNickDone(false)
    setLoadingNick(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('profiles').update({ nickname: nickname.trim() }).eq('id', session.user.id)
    setLoadingNick(false)
    if (error) { setNickError('변경 중 오류가 발생했습니다.'); return }
    setNickDone(true)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { setPwError('비밀번호는 6자리 이상 입력해주세요.'); return }
    if (newPassword !== confirmPw) { setPwError('비밀번호가 일치하지 않습니다.'); return }
    setPwError('')
    setPwDone(false)
    setLoadingPw(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoadingPw(false)
    if (error) { setPwError('변경 중 오류가 발생했습니다: ' + error.message); return }
    setNewPassword('')
    setConfirmPw('')
    setPwDone(true)
  }

  if (!initDone) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <a href="/mypage" className="text-sm text-gray-400 hover:text-[#01273A]">← 마이페이지</a>
          </div>
          <h1 className="mb-8 text-2xl font-black text-[#01273A]">정보 변경</h1>

          {/* 닉네임 변경 */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#01273A]">닉네임 변경</h2>
            <form onSubmit={handleNickname} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#555555]">새 닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value); setNickError(''); setNickDone(false) }}
                  maxLength={20}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-[#333333] outline-none focus:border-[#01273A]"
                />
              </div>
              {nickError && <p className="text-sm text-red-500">{nickError}</p>}
              {nickDone  && <p className="text-sm text-emerald-600">닉네임이 변경되었습니다.</p>}
              <button
                type="submit"
                disabled={loadingNick}
                className="w-full rounded-xl bg-[#01273A] py-3 text-base font-bold text-white hover:brightness-90 disabled:opacity-60 transition-all"
              >
                {loadingNick ? '변경 중...' : '닉네임 변경'}
              </button>
            </form>
          </div>

          {/* 비밀번호 변경 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#01273A]">비밀번호 변경</h2>
            <form onSubmit={handlePassword} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#555555]">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPwError(''); setPwDone(false) }}
                  placeholder="6자리 이상"
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-[#333333] outline-none focus:border-[#01273A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#555555]">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); setPwDone(false) }}
                  placeholder="비밀번호 재입력"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-[#333333] outline-none focus:border-[#01273A]"
                />
              </div>
              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
              {pwDone  && <p className="text-sm text-emerald-600">비밀번호가 변경되었습니다.</p>}
              <button
                type="submit"
                disabled={loadingPw}
                className="w-full rounded-xl bg-[#01273A] py-3 text-base font-bold text-white hover:brightness-90 disabled:opacity-60 transition-all"
              >
                {loadingPw ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
