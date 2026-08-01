'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import FloatingDreamButton from './FloatingDreamButton'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { useRemainingCount } from '@/hooks/useRemainingCount'

type DropdownItem = { label: string; href: string }
type NavItem =
  | { label: string; href: string; dropdown?: never }
  | { label: string; href?: never; dropdown: DropdownItem[] }

// 카테고리 목록을 불러오기 전 잠깐 보여줄 폴백 (깜빡임 방지용, DB 응답 오면 즉시 교체됨)
const FALLBACK_CATEGORIES: DropdownItem[] = [
  { label: '인물·신체', href: '/category/people' },
  { label: '동물·식물', href: '/category/animals' },
  { label: '자연·사물', href: '/category/nature' },
  { label: '행동·상황', href: '/category/action' },
  { label: '기타',     href: '/category/etc' },
]

const SUPPORT_DROPDOWN: DropdownItem[] = [
  { label: '길몽상점소개', href: '/guide'       },
  { label: '고객센터',    href: '/support'     },
  { label: '이용안내',    href: '/usage-guide' },
  { label: 'FAQ',        href: '/faq'         },
  { label: '공지사항',    href: '/notice'      },
  { label: '1:1 문의',   href: '/inquiry'     },
  { label: '제휴문의',    href: '/partnerships'},
]

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-3.5 w-3.5'} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function SiteHeader() {
  const router   = useRouter()
  const pathname = usePathname()
  const { remaining, fetchRemaining } = useRemainingCount()

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [menuOpen, setMenuOpen]     = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')
  const [loggedIn, setLoggedIn]     = useState(false)
  const [nickname, setNickname]     = useState('')
  // 모바일 아코디언: 드롭다운 label로 관리
  const [mobileOpen, setMobileOpen] = useState<string | null>(null)
  const [categoryItems, setCategoryItems] = useState<DropdownItem[]>(FALLBACK_CATEGORIES)
  const inputRef = useRef<HTMLInputElement>(null)

  const dictionaryDropdown: DropdownItem[] = [
    { label: '전체 사전', href: '/dictionary' },
    ...categoryItems.map((c) => ({
      label: `${c.label} 해몽`,
      href: `/dictionary/category/${c.href.replace('/category/', '')}`,
    })),
  ]

  const NAV: NavItem[] = [
    { label: '홈', href: '/' },
    { label: '꿈 감정하기', href: '/#appraisal' },
    { label: '꿈 구경하기', dropdown: categoryItems },
    { label: '해몽 사전',  dropdown: dictionaryDropdown },
    { label: '고객지원',   dropdown: SUPPORT_DROPDOWN },
  ]

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset'
  }, [menuOpen])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('name, slug')
      .eq('domain', 'dream')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }: { data: { name: string; slug: string }[] | null }) => {
        if (data && data.length > 0) {
          setCategoryItems(data.map((c) => ({ label: c.name, href: `/category/${c.slug}` })))
        }
      })
  }, [])

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
    let currentUserId: string | null = null

    async function syncAuth(session: Session | null) {
      if (!isMounted) return
      setLoggedIn(!!session)
      if (!session?.user) { setNickname(''); currentUserId = null; return }

      currentUserId = session.user.id
      const emailFallback = session.user.email?.split('@')[0] ?? '사용자'
      setNickname(emailFallback)

      try {
        const [{ data: profile }] = await Promise.all([
          supabase.from('profiles').select('nickname').eq('id', currentUserId).single(),
          fetchRemaining(),
        ])
        if (!isMounted) return
        setNickname(profile?.nickname ?? emailFallback)
      } catch { /* 폴백 유지 */ }
    }

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      syncAuth(result.data.session).catch(() => {})
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      syncAuth(session).catch(() => {})
    })

    return () => { isMounted = false; subscription.unsubscribe() }
  }, [fetchRemaining])

  function handleSearch(e: React.FormEvent, q: string, type: 'desktop' | 'mobile') {
    e.preventDefault()
    if (!q.trim()) return
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
    if (type === 'desktop') { setSearchOpen(false); setQuery('') }
    else { setMenuOpen(false); setMobileQuery('') }
  }

  function isActive(item: NavItem) {
    if (item.href) return pathname === item.href || (item.href === '/' && pathname === '/')
    return item.dropdown?.some((d) => pathname === d.href) ?? false
  }

  return (
    <>
      <FloatingDreamButton />
      <div className="sticky top-0 z-50">
        <header className="border-b border-brand-line bg-white/85 backdrop-blur-lg">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">

            {/* 로고 */}
            <Link href="/" className="flex items-center">
              <Image src="/logo_1.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
            </Link>

            {/* 데스크탑 네비 */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) =>
                item.dropdown ? (
                  /* 드롭다운 메뉴 */
                  <div key={item.label} className="group relative">
                    <button
                      className="flex items-center gap-1 rounded-full px-3 py-2 text-[0.95rem] font-semibold text-brand-ink-soft transition-colors hover:text-brand-ink"
                    >
                      {item.label}
                      <ChevronDown className="h-2.5 w-2.5 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
                    </button>

                    {/* 드롭다운 패널 */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2.5 invisible opacity-0 translate-y-1.5 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                      <ul className="min-w-[150px] overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 shadow-[0_14px_34px_rgba(11,36,51,0.12)]">
                        {item.dropdown.map((d) => (
                          <li key={d.label}>
                            <Link
                              href={d.href}
                              className={`block rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-brand-primary-light hover:text-brand-primary-hover ${
                                pathname === d.href ? 'font-semibold text-brand-primary' : 'text-brand-ink-soft'
                              }`}
                            >
                              {d.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  /* 일반 링크 */
                  <Link
                    key={item.label}
                    href={item.href!}
                    className="rounded-full px-3 py-2 text-[0.95rem] font-semibold text-brand-ink-soft transition-colors hover:text-brand-ink"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* 우측 액션 */}
            <div className="flex items-center gap-4 text-brand-ink-soft">
              {/* 검색 버튼 (데스크탑) */}
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={`hidden transition-colors hover:text-brand-ink md:block ${searchOpen ? 'text-brand-ink' : ''}`}
              >
                {searchOpen
                  ? <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>}
              </button>

              {/* 로그인/유저 (데스크탑) */}
              <Link
                href={loggedIn ? '/mypage' : '/auth/login'}
                className="flex items-center gap-1.5 text-brand-ink-soft transition-colors hover:text-brand-ink max-md:hidden"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
                </svg>
                {loggedIn ? (
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-brand-ink">{nickname}님</span>
                    {remaining !== null && (
                      <span className={`text-xs font-normal ${remaining === 0 ? 'text-red-400' : 'text-brand-primary'}`}>
                        해몽 {remaining}회 남음
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm font-semibold">로그인</span>
                )}
              </Link>

              {/* 로그인 상태 (모바일) */}
              {loggedIn && (
                <Link href="/mypage" className="flex flex-col items-end leading-tight md:hidden">
                  <span className="text-xs font-semibold text-brand-ink">{nickname}님</span>
                  {remaining !== null && (
                    <span className={`text-[10px] ${remaining === 0 ? 'text-red-400' : 'text-brand-primary'}`}>
                      해몽 {remaining}회 남음
                    </span>
                  )}
                </Link>
              )}

              {/* 햄버거 (모바일) */}
              <button type="button" onClick={() => setMenuOpen(true)} className="flex items-center justify-center text-brand-ink md:hidden">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 데스크탑 검색바 */}
        <div className={`overflow-hidden border-b border-brand-line bg-white transition-all duration-300 ease-in-out ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={(e) => handleSearch(e, query, 'desktop')} className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="꿈 제목 또는 내용으로 검색" className="flex-1 bg-transparent text-base text-brand-ink outline-none placeholder:text-brand-ink-soft/60" />
            <button type="submit" className="shrink-0 rounded-full bg-brand-ink px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover">검색</button>
          </form>
        </div>
      </div>

      {/* 모바일 오버레이 */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 md:hidden ${menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* 모바일 사이드 패널 */}
      <div className={`fixed right-0 top-0 z-[70] h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between border-b border-brand-line px-5 py-4">
          <span className="text-base font-semibold text-brand-ink">메뉴</span>
          <button type="button" onClick={() => setMenuOpen(false)} className="text-brand-ink">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
          {/* 검색 */}
          <div className="border-b border-brand-line px-5 py-4">
            <form onSubmit={(e) => handleSearch(e, mobileQuery, 'mobile')} className="flex items-center gap-2 rounded-full border border-brand-line px-4 py-2">
              <input type="text" value={mobileQuery} onChange={(e) => setMobileQuery(e.target.value)} placeholder="꿈 검색" className="flex-1 bg-transparent text-sm text-brand-ink outline-none" />
            </form>
          </div>

          {/* 로그인/회원가입 */}
          <div className="flex flex-col gap-1 border-b border-brand-line px-5 py-3">
            <Link href={loggedIn ? '/mypage' : '/auth/login'} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-primary-light">
              {loggedIn ? (
                <span className="flex items-center justify-between">
                  <span>{nickname}님</span>
                  {remaining !== null && (
                    <span className={`text-xs font-normal ${remaining === 0 ? 'text-red-400' : 'text-brand-primary'}`}>
                      해몽 {remaining}회 남음
                    </span>
                  )}
                </span>
              ) : '로그인'}
            </Link>
            {!loggedIn && (
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-primary-light">회원가입</Link>
            )}
          </div>

          {/* 네비게이션 */}
          <div className="flex flex-col gap-0.5 border-b border-brand-line px-5 py-3">
            {NAV.map((item) =>
              item.dropdown ? (
                <div key={item.label}>
                  {/* 아코디언 헤더 */}
                  <button
                    type="button"
                    onClick={() => setMobileOpen(mobileOpen === item.label ? null : item.label)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-primary-light"
                  >
                    <span className={isActive(item) ? 'font-semibold text-brand-primary' : ''}>{item.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${mobileOpen === item.label ? 'rotate-180' : ''}`} />
                  </button>
                  {/* 아코디언 내용 */}
                  {mobileOpen === item.label && (
                    <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l-2 border-brand-line pl-3">
                      {item.dropdown.map((d) => (
                        <Link
                          key={d.label}
                          href={d.href}
                          onClick={() => { setMenuOpen(false); setMobileOpen(null) }}
                          className={`rounded-lg px-3 py-2 text-sm ${pathname === d.href ? 'font-semibold text-brand-primary' : 'text-brand-ink-soft hover:bg-brand-primary-light hover:text-brand-ink'}`}
                        >
                          {d.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm ${isActive(item) ? 'font-semibold text-brand-primary' : 'text-brand-ink hover:bg-brand-primary-light'}`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
