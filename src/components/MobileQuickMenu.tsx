'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// tabler-icons 웹폰트가 프로젝트에 없어(전체 코드베이스가 인라인 SVG 컨벤션) 같은 모양을
// 인라인 SVG로 재현했다. ti-moon-stars / ti-book-2 / ti-shopping-bag / ti-user와 시각적으로 대응.
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-6 w-6',
}

function MoonStarsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
      <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
      <path d="M19 11h2m-1 -1v2" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M19 4v13h-13a2 2 0 0 0 -2 2v-15a2 2 0 0 1 2 -2h13z" />
      <path d="M19 17v2a2 2 0 0 1 -2 2h-12.5" />
    </svg>
  )
}

function ShoppingBagIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152a3 3 0 0 1 -2.966 2.544h-6.852a3 3 0 0 1 -2.965 -2.544l-1.255 -8.152a2 2 0 0 1 1.977 -2.304z" />
      <path d="M9 11v-5a3 3 0 0 1 6 0v5" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12.586 2.586a2 2 0 0 0 -2.828 0l-8.172 8.172a2 2 0 0 0 0 2.828l6.586 6.586a2 2 0 0 0 2.828 0l8.172 -8.172a2 2 0 0 0 0 -2.828z" />
      <path d="M16 8h.01" />
    </svg>
  )
}

export default function MobileQuickMenu() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      setLoggedIn(!!result.data.session?.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const items = [
    { label: '꿈감정', href: '/#appraisal', gradient: 'from-[#534AB7] to-[#6F63D6]', Icon: MoonStarsIcon },
    { label: '꿈구경', href: '/category/all', gradient: 'from-[#185FA5] to-[#2E7DD1]', Icon: ShoppingBagIcon },
    { label: '해몽사전', href: '/dictionary', gradient: 'from-[#0F6E56] to-[#1D9E75]', Icon: BookIcon },
    { label: '굿즈샵', href: '/shop', gradient: 'from-[#B5502A] to-[#D46B3E]', Icon: TagIcon },
    { label: '마이', href: loggedIn ? '/mypage' : '/auth/login', gradient: 'from-[#5F5E5A] to-[#7A7975]', Icon: UserIcon },
  ]

  return (
    <div className="grid grid-cols-5 gap-0.5 px-2 py-5 md:hidden">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex flex-col items-center gap-1.5 py-1"
        >
          <span className={`flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-gradient-to-br text-white ${item.gradient}`}>
            <item.Icon />
          </span>
          <span className="text-xs font-medium text-brand-ink-soft">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
