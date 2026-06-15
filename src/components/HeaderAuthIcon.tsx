'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HeaderAuthIcon() {
  const [href, setHref] = useState('/auth/login')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setHref(session ? '/mypage' : '/auth/login')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setHref(session ? '/mypage' : '/auth/login')
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <a href={href} aria-label="로그인/마이페이지" className="hover:text-[#01273A]">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
    </a>
  )
}
