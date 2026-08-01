'use client'

import { usePathname } from 'next/navigation'
import SiteHeader, { type SiteHeaderCategory } from './SiteHeader'

interface Props {
  categories: SiteHeaderCategory[]
}

// /admin, /auth 는 자체 레이아웃(어드민 사이드바 / 로그인 폼)을 쓰므로 공개 사이트 헤더를 띄우지 않는다.
export default function SiteHeaderGate({ categories }: Props) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null
  return <SiteHeader categories={categories} />
}
