import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = { title: '환불 정책' }

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <main className="flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl rounded-[4px] border border-brand-line bg-white p-6 md:p-10">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-brand-ink">환불 정책</h1>
          <p className="mb-10 text-sm text-brand-ink-soft">시행일: 2026년 11월 1일</p>
          <div className="space-y-8 text-sm leading-relaxed text-[#3A322C]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">1. 환불 신청</h2>
              <p>구매한 꿈은 결제 후 <strong>7일 이내</strong>에 마이페이지 → 결제 주문 내역 → 환불요청에서 신청할 수 있습니다. 관리자가 내용을 검토한 뒤 처리하며, 승인되면 결제 금액이 전액 환불됩니다.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">2. 처리 절차</h2>
              <ul className="list-disc space-y-1 pl-6">
                <li>환불 요청 접수 → 관리자 검토 → 승인 또는 반려 안내</li>
                <li>서비스 결함 등 회사 사정으로 인한 문제는 정책에 따라 우선 처리합니다.</li>
                <li>충전 포인트의 환불은 이용약관 및 결제 대행사 규정에 따릅니다.</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">3. 에스크로 보호</h2>
              <p>구매 확정 전까지 결제 대금은 안전하게 보관되며, 분쟁이 접수된 거래는 검토가 끝날 때까지 판매자에게 정산되지 않습니다.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">4. 문의</h2>
              <p>환불과 관련해 궁금한 점은 고객센터의 1:1 문의로 남겨 주세요.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
