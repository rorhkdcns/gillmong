import type { Metadata } from 'next'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'
import { getSiteInfo } from '@/lib/siteSettings'

export const metadata: Metadata = { title: '고객센터' }

const QUICK = [
  { href: '/faq', title: '자주 묻는 질문', desc: '환불·결제·거래 궁금증을 먼저 확인해 보세요.' },
  { href: '/usage-guide', title: '이용안내', desc: '감정부터 거래, 정산까지 한눈에 보기.' },
  { href: '/notice', title: '공지사항', desc: '서비스 소식과 변경 안내.' },
  { href: '/inquiry', title: '1:1 문의', desc: '로그인 후 남기면 담당자가 답변드려요.' },
  { href: '/partnerships', title: '제휴문의', desc: '광고·콘텐츠·사업 제휴 제안.' },
  { href: '/refund-policy', title: '환불 정책', desc: '결제 후 7일 이내 환불 요청.' },
]

export default async function SupportPage() {
  const info = await getSiteInfo()
  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <section className="bg-brand-primary-light">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">무엇을 도와드릴까요?</h1>
          <p className="mt-3 text-base text-brand-ink-soft">궁금한 점은 아래에서 바로 찾거나, 문의를 남겨 주세요.</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className="gm-card group flex flex-col gap-1.5 rounded-[4px] border border-brand-line bg-white p-5">
              <strong className="text-base text-brand-ink group-hover:text-brand-primary">{q.title} →</strong>
              <span className="text-sm leading-relaxed text-brand-ink-soft">{q.desc}</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[4px] bg-brand-ink p-6 text-white md:p-8">
            <h2 className="mb-3 text-lg font-bold">연락처</h2>
            <p className="font-display text-3xl font-extrabold">{info.phone}</p>
            <p className="mt-2 text-sm text-white/70">{info.hours} · {info.lunch}</p>
            <a href={`mailto:${info.email}`} className="mt-4 inline-block rounded-[3px] bg-brand-gold px-5 py-2.5 text-sm font-bold text-brand-ink hover:opacity-90">
              {info.email}
            </a>
            <p className="mt-4 text-xs text-white/50">운영시간 외 문의는 이메일 또는 1:1 문의를 이용해 주세요. 영업일 기준 1~2일 내 답변드려요.</p>
          </div>

          <div className="rounded-[4px] border border-brand-line bg-white p-6 md:p-8">
            <h2 className="mb-3 text-lg font-bold text-brand-ink">사업자 정보</h2>
            <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-brand-ink-soft">상호명</dt><dd className="text-brand-ink">{info.companyName}</dd>
              <dt className="text-brand-ink-soft">대표자</dt><dd className="text-brand-ink">{info.ceo}</dd>
              <dt className="text-brand-ink-soft">사업자등록번호</dt><dd className="text-brand-ink">{info.businessNumber}</dd>
              <dt className="text-brand-ink-soft">통신판매업</dt><dd className="text-brand-ink">{info.mailOrderNumber}</dd>
              <dt className="text-brand-ink-soft">주소</dt><dd className="text-brand-ink">{info.address}</dd>
            </dl>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
