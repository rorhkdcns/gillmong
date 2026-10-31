'use client'

import Link from 'next/link'
import { useSiteInfo } from '@/components/SiteInfoProvider'

const SERVICE_LINKS = [
  { label: '꿈 감정하기', href: '/#appraisal' },
  { label: '꿈 구경하기', href: '/category/all' },
  { label: '해몽 사전', href: '/dictionary' },
  { label: '오늘의 운세', href: '/fortune' },
  { label: '굿즈샵', href: '/shop' },
]

const SUPPORT_LINKS = [
  { label: '고객센터', href: '/support' },
  { label: '이용안내', href: '/usage-guide' },
  { label: 'FAQ', href: '/faq' },
  { label: '공지사항', href: '/notice' },
  { label: '1:1 문의', href: '/inquiry' },
  { label: '제휴문의', href: '/partnerships' },
]

const POLICY_LINKS = [
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
]

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="min-w-[8rem] flex-1">
      <strong className="mb-1.5 block text-sm text-brand-ink">{title}</strong>
      {links.map((l) => (
        <Link key={l.label} href={l.href} className="block py-1 text-sm text-brand-ink-soft transition-colors hover:text-brand-primary">
          {l.label}
        </Link>
      ))}
    </div>
  )
}

export default function SiteFooter() {
  const SITE_INFO = useSiteInfo()
  return (
    <footer className="border-t border-brand-line bg-brand-page text-brand-ink-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-10 gap-y-8 px-6 pb-5 pt-10 text-sm">
        {/* 고객센터 + 에스크로 안내 */}
        <div className="flex min-w-[16rem] flex-[1.6] flex-col gap-3.5">
          <div>
            <strong className="font-display text-xl text-brand-ink">{SITE_INFO.phone}</strong>
            <p className="mt-1 leading-relaxed">
              {SITE_INFO.hours} · {SITE_INFO.lunch}
              <br />
              {SITE_INFO.email}
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-[4px] border border-brand-line bg-white px-3 py-2.5">
            <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#12A150] text-xs font-extrabold text-white">✓</span>
            <span className="leading-relaxed">
              <strong className="text-brand-ink">에스크로 결제 보호</strong>
              <br />
              구매 확정 전까지 결제 대금을 안전하게 보관해요.
            </span>
          </div>
        </div>

        <LinkColumn title="서비스" links={SERVICE_LINKS} />
        <LinkColumn title="고객지원" links={SUPPORT_LINKS} />
        <LinkColumn title="약관·정책" links={POLICY_LINKS} />
      </div>

      {/* 사업자 정보 (전자상거래법 표시 의무) */}
      <div className="mx-auto max-w-6xl px-6 pb-8">
        <div className="border-t border-brand-line pt-4 text-xs leading-[1.9]">
          <p>
            상호 {SITE_INFO.companyName} <span aria-hidden="true">|</span> 대표자 {SITE_INFO.ceo} <span aria-hidden="true">|</span> 사업자등록번호 {SITE_INFO.businessNumber} <span aria-hidden="true">|</span> 통신판매업 신고번호 {SITE_INFO.mailOrderNumber}
          </p>
          <p>사업장 주소 {SITE_INFO.address}</p>
          <p>길몽상점은 통신판매중개자이며 거래 당사자가 아닙니다. 꿈 콘텐츠의 판매 및 책임은 각 판매 회원에게 있습니다.</p>
          <p className="mt-3">© 2026 길몽상점. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
