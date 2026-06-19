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
    let currentUserId: string | null = null

    async function refreshCount(userId: string) {
      const todayISO = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('analysis_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayISO)
      setUsedToday(count ?? 0)
    }

    async function syncAuth(session: Session | null) {
      if (!session?.user) {
        setLoggedIn(false)
        setNickname('')
        setUsedToday(0)
        setLoaded(true)
        currentUserId = null
        return
      }

      const userId = session.user.id
      currentUserId = userId
      const emailFallback = session.user.email?.split('@')[0] ?? '사용자'

      setLoggedIn(true)
      setNickname(emailFallback)
      setLoaded(true)

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

    function onDreamAnalyzed() {
      if (currentUserId) refreshCount(currentUserId).catch(() => {})
    }

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      syncAuth(result.data.session).catch(() => {})
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      syncAuth(session).catch(() => {})
    })

    window.addEventListener('dream-analyzed', onDreamAnalyzed)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('dream-analyzed', onDreamAnalyzed)
    }
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
            <span className="font-normal text-gray-400">(
              <span className={`font-bold ${remaining === 0 ? 'text-red-400' : 'text-[#E07B2A]'}`}>{remaining}</span>
            회)</span>
          </>
        ) : (
          '로그인'
        )}
      </span>
    </Link>
  )
}
