'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import HeaderAuthIcon from './HeaderAuthIcon'
import FloatingDreamButton from './FloatingDreamButton'

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setQuery('')
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
            <button
              aria-label={searchOpen ? '검색 닫기' : '검색'}
              onClick={() => setSearchOpen((v) => !v)}
              className={`transition-colors hover:text-[#01273A] ${searchOpen ? 'text-[#01273A]' : ''}`}
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

            <HeaderAuthIcon />
          </div>
        </div>
      </header>

      {/* ───── 슬라이드 검색바 ───── */}
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
    </>
  )
}
