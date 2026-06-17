'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import HeaderAuthIcon from './HeaderAuthIcon'
import FloatingDreamButton from './FloatingDreamButton'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: '이용방법',  href: '/guide' },
  { label: '인물·신체', href: '/category/people' },
  { label: '동물·식물', href: '/category/animals' },
  { label: '자연·사물', href: '/category/nature' },
  { label: '행동·상황', href: '/category/action' },
  { label: '기타',      href: '/category/etc' },
]

export default function SiteHeader({ activePath }: { activePath?: string }) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setQuery('')
  }

  function handleMobileSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = mobileQuery.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setMenuOpen(false)
    setMobileQuery('')
  }

  return (
    <>
    <FloatingDreamButton />
    <div className="sticky top-0 z-50">

      {/* ───── 메인 헤더 ───── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">

          <a href="/" className="flex items-center">
            <Image src="/logo_1.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
          </a>

          {/* 데스크탑 네비 */}
          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-base transition-colors hover:text-[#01273A] ${
                  item.href === activePath
                    ? 'text-[#E07B2A] underline underline-offset-4'
                    : 'text-[#333333]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-[#333333]">
            {/* 데스크탑 검색 버튼 */}
            <button
              aria-label={searchOpen ? '검색 닫기' : '검색'}
              onClick={() => setSearchOpen((v) => !v)}
              className={`hidden transition-colors hover:text-[#01273A] md:block ${searchOpen ? 'text-[#01273A]' : ''}`}
            >
              {searchOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              )}
            </button>

            {/* 데스크탑 유저 아이콘 */}
            <div className="hidden md:block">
              <HeaderAuthIcon />
            </div>

            {/* 모바일 햄버거 버튼 */}
            <button
              aria-label="메뉴 열기"
              onClick={() => setMenuOpen(true)}
              className="flex items-center justify-center text-[#01273A] md:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ───── 데스크탑 슬라이드 검색바 ───── */}
      <div
        className={`overflow-hidden border-b border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={handleSearch} className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="꿈 제목 또는 내용으로 검색"
            className="flex-1 bg-transparent text-base text-[#333333] placeholder:text-gray-400 outline-none"
          />
          <button
            type="submit"
            className="shrink-0 bg-[#01273A] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-90"
          >
            검색
          </button>
        </form>
      </div>

    </div>

    {/* ───── 모바일 사이드 메뉴 ───── */}
    {/* 오버레이 */}
    <div
      className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 md:hidden ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setMenuOpen(false)}
    />

    {/* 슬라이드 패널 */}
    <div
      className={`fixed right-0 top-0 z-[70] h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <span className="text-base font-semibold text-[#01273A]">메뉴</span>
        <button
          aria-label="메뉴 닫기"
          onClick={() => setMenuOpen(false)}
          className="text-[#01273A]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
        {/* 검색 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <form onSubmit={handleMobileSearch} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">
            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder="꿈 검색"
              className="flex-1 bg-transparent text-sm text-[#333333] placeholder:text-gray-400 outline-none"
            />
          </form>
        </div>

        {/* 로그인/마이페이지 + 회원가입 */}
        <div className="flex flex-col gap-1 px-5 py-3 border-b border-gray-100">
          <a
            href={loggedIn ? '/mypage' : '/auth/login'}
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#01273A] hover:bg-gray-50"
          >
            {loggedIn ? '마이페이지' : '로그인'}
          </a>
          {!loggedIn && (
            <a
              href="/auth/signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-[#01273A] hover:bg-gray-50"
            >
              회원가입
            </a>
          )}
        </div>

        {/* 구분선 + 네비 메뉴 */}
        <div className="flex flex-col gap-1 px-5 py-3 border-b border-gray-100">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                item.href === activePath
                  ? 'font-semibold text-[#E07B2A]'
                  : 'text-[#01273A]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* 고객지원 메뉴 */}
        <div className="flex flex-col gap-1 px-5 py-3">
          <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">고객지원</p>
          {[
            { label: '공지사항', href: '/notice' },
            { label: 'FAQ',     href: '/faq'    },
            { label: '고객센터', href: '/support' },
            { label: '1:1 문의', href: '/inquiry' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-[#01273A] transition-colors hover:bg-gray-50"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
