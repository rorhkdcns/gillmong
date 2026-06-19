'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import HeaderAuthIcon from './HeaderAuthIcon'
import FloatingDreamButton from './FloatingDreamButton'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

const navItems = [
  { label: '이용방법', href: '/guide' },
  { label: '인물·신체', href: '/category/people' },
  { label: '동물·식물', href: '/category/animals' },
  { label: '자연·사물', href: '/category/nature' },
  { label: '행동·상황', href: '/category/action' },
  { label: '기타', href: '/category/etc' },
]

export default function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [nickname, setNickname] = useState('')
  const [remaining, setRemaining] = useState(3)
  const inputRef = useRef<HTMLInputElement>(null)

  const DAILY_LIMIT = 3

  // 메뉴 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset'
  }, [menuOpen])

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    async function syncAuth(session: Session | null) {
      if (!isMounted) return
      setLoggedIn(!!session)
      if (!session?.user) { setNickname(''); setRemaining(DAILY_LIMIT); return }

      try {
        const userId = session.user.id
        const todayISO = new Date().toISOString().split('T')[0]

        const [{ data: profile }, { count }] = await Promise.all([
          supabase.from('profiles').select('nickname').eq('id', userId).single(),
          supabase.from('analysis_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayISO),
        ])

        if (!isMounted) return
        setNickname(profile?.nickname ?? session.user.email?.split('@')[0] ?? '')
        setRemaining(DAILY_LIMIT - (count ?? 0))
      } catch {
        // 조회 실패해도 로그인 상태는 유지
      }
    }

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      syncAuth(result.data.session).catch(() => {})
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      syncAuth(session).catch(() => {})
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [DAILY_LIMIT])

  function handleSearch(e: React.FormEvent, q: string, type: 'desktop' | 'mobile') {
    e.preventDefault()
    if (!q.trim()) return
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
    if (type === 'desktop') { setSearchOpen(false); setQuery('') }
    else { setMenuOpen(false); setMobileQuery('') }
  }

  return (
    <>
      <FloatingDreamButton />
      <div className="sticky top-0 z-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center">
              <Image src="/logo_1.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-base transition-colors hover:text-[#01273A] ${
                    pathname === item.href ? 'text-[#E07B2A] underline underline-offset-4' : 'text-[#333333]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 text-[#333333]">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={`hidden transition-colors hover:text-[#01273A] md:block ${searchOpen ? 'text-[#01273A]' : ''}`}
              >
                {searchOpen ? <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>}
              </button>
              <div className="hidden md:block">
                <HeaderAuthIcon />
              </div>
              <button type="button" onClick={() => setMenuOpen(true)} className="flex items-center justify-center text-[#01273A] md:hidden">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </header>

        <div className={`overflow-hidden border-b border-gray-200 bg-white transition-all duration-300 ease-in-out ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={(e) => handleSearch(e, query, 'desktop')} className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="꿈 제목 또는 내용으로 검색" className="flex-1 bg-transparent text-base outline-none" />
            <button type="submit" className="shrink-0 bg-[#01273A] px-5 py-2 text-sm font-semibold text-white">검색</button>
          </form>
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuOpen(false)} />

      <div className={`fixed right-0 top-0 z-[70] h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <span className="text-base font-semibold text-[#01273A]">메뉴</span>
          <button type="button" onClick={() => setMenuOpen(false)} className="text-[#01273A]"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex flex-col overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
          <div className="px-5 py-4 border-b border-gray-100">
            <form onSubmit={(e) => handleSearch(e, mobileQuery, 'mobile')} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">
              <input type="text" value={mobileQuery} onChange={(e) => setMobileQuery(e.target.value)} placeholder="꿈 검색" className="flex-1 bg-transparent text-sm outline-none" />
            </form>
          </div>

          <div className="flex flex-col gap-1 px-5 py-3 border-b border-gray-100">
            <Link href={loggedIn ? '/mypage' : '/auth/login'} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#01273A] hover:bg-gray-50">
              {loggedIn ? (
                <span className="flex items-center justify-between">
                  <span>{nickname}님</span>
                  <span className={`text-xs font-normal ${remaining === 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    해몽 {remaining}/{DAILY_LIMIT}회 남음
                  </span>
                </span>
              ) : '로그인'}
            </Link>
            {!loggedIn && <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-[#01273A] hover:bg-gray-50">회원가입</Link>}
          </div>

          <div className="flex flex-col gap-1 px-5 py-3 border-b border-gray-100">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm ${pathname === item.href ? 'font-semibold text-[#E07B2A]' : 'text-[#01273A]'}`}>{item.label}</Link>
            ))}
          </div>

          <div className="flex flex-col gap-1 px-5 py-3">
            <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">고객지원</p>
            {[{ label: '공지사항', href: '/notice' }, { label: 'FAQ', href: '/faq' }, { label: '고객센터', href: '/support' }, { label: '1:1 문의', href: '/inquiry' }].map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-[#01273A] hover:bg-gray-50">{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}