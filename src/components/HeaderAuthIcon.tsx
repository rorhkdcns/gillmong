'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HeaderAuthIcon() {
  const [href, setHref]         = useState('/auth/login')
  const [label, setLabel]       = useState('로그인')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function syncSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', session.user.id)
          .single()
        const nickname = profile?.nickname ?? session.user.email?.split('@')[0] ?? '사용자'
        setLabel(`${nickname}님`)
        setHref('/mypage')
        setLoggedIn(true)
      } else {
        setLabel('로그인')
        setHref('/auth/login')
        setLoggedIn(false)
      }
    }

    syncSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncSession()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <a
      href={href}
      aria-label={loggedIn ? '마이페이지' : '로그인'}
      className="flex items-center gap-1.5 text-[#333333] hover:text-[#01273A]"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
      <span className="text-sm font-semibold">{label}</span>
    </a>
  )
}
