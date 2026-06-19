'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const DAILY_LIMIT = 3

export default function HeaderAuthIcon() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [nickname, setNickname] = useState('')
  const [usedToday, setUsedToday] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function syncAuth(session: Session | null) {
      if (!session?.user) {
        setLoggedIn(false)
        setNickname('')
        setUsedToday(0)
        setLoaded(true)
        return
      }

      const userId = session.user.id
      const emailFallback = session.user.email?.split('@')[0] ?? '사용자'

      // 세션 확인 즉시 로그인 상태 + 폴백 닉네임 표시
      setLoggedIn(true)
      setNickname(emailFallback)
      setLoaded(true)

      // 프로필/횟수 조회 — 실패해도 로그인 상태 유지
      try {
        const todayISO = new Date().toISOString().split('T')[0]
        const [{ data: profile }, { count }] = await Promise.all([
          supabase.from('profiles').select('nickname').eq('id', userId).single(),
          supabase
            .from('analysis_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', todayISO),
        ])
        setNickname(profile?.nickname ?? emailFallback)
        setUsedToday(count ?? 0)
      } catch {
        // 조회 실패해도 폴백 닉네임 유지
      }
    }

    // 초기 세션 확인
    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      syncAuth(result.data.session).catch(() => {})
    })

    // auth 상태 변경 시 session을 직접 받아 처리 (getSession() 재호출 불필요)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      syncAuth(session).catch(() => {})
    })

    return () => subscription.unsubscribe()
  }, [])

  const remaining = DAILY_LIMIT - usedToday

  if (!loaded) return <span className="min-w-[60px] text-sm opacity-0">로그인</span>

  return (
    <Link
      href={loggedIn ? '/mypage' : '/auth/login'}
      className="flex items-center gap-1.5 text-[#333333] transition-colors hover:text-[#01273A]"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
      <span className="min-w-[60px] text-sm font-semibold">
        {loggedIn ? (
          <>
            {nickname}님{' '}
            <span className={`font-normal ${remaining === 0 ? 'text-red-400' : 'text-gray-400'}`}>
              ({remaining}/{DAILY_LIMIT})
            </span>
          </>
        ) : (
          '로그인'
        )}
      </span>
    </Link>
  )
}
