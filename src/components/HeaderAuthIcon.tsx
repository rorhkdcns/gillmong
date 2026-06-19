'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DAILY_LIMIT = 3

export default function HeaderAuthIcon() {
  const [href, setHref] = useState('/auth/login')
  const [nickname, setNickname] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [usedToday, setUsedToday] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function syncSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const userId = session.user.id
          const emailFallback = session.user.email?.split('@')[0] ?? '사용자'
          setNickname(emailFallback)
          setHref('/mypage')
          setLoggedIn(true)

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
        } else {
          setNickname('')
          setUsedToday(0)
          setHref('/auth/login')
          setLoggedIn(false)
        }
      } catch {
        setLoggedIn(false)
      } finally {
        setLoaded(true)
      }
    }

    syncSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => syncSession())
    return () => subscription.unsubscribe()
  }, [])

  const remaining = DAILY_LIMIT - usedToday

  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-[#333333] hover:text-[#01273A] transition-colors"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
      
      {/* 로딩 중일 때 레이아웃 흔들림 방지용 min-w 설정 */}
      <span className="text-sm font-semibold min-w-[60px]">
        {loaded ? (
          loggedIn ? (
            <>
              {nickname}님{' '}
              <span className={`font-normal ${remaining === 0 ? 'text-red-400' : 'text-gray-400'}`}>
                ({remaining}/{DAILY_LIMIT})
              </span>
            </>
          ) : (
            '로그인'
          )
        ) : (
          <span className="opacity-0">로그인</span> 
        )}
      </span>
    </Link>
  )
}