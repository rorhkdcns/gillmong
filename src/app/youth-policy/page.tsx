import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = { title: '청소년 보호 정책' }

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <main className="flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl rounded-[4px] border border-brand-line bg-white p-6 md:p-10">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-brand-ink">청소년 보호 정책</h1>
          <p className="mb-10 text-sm text-brand-ink-soft">시행일: 2026년 11월 1일</p>
          <div className="space-y-8 text-sm leading-relaxed text-[#3A322C]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">1. 가입 제한</h2>
              <p>만 14세 미만 아동은 회원으로 가입할 수 없습니다. 만 14세 이상 청소년은 법정대리인의 보호 아래 서비스를 이용해 주세요.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">2. 유해 콘텐츠 관리</h2>
              <p>청소년에게 부적절한 꿈 콘텐츠는 등록할 수 없으며, 신고가 접수되면 검토 후 비공개 또는 삭제합니다. 불건전한 내용은 각 꿈 상세 화면의 신고 기능으로 알려 주세요.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">3. 결제 보호</h2>
              <p>청소년의 과도한 결제를 막기 위해 비정상적인 결제가 확인되면 이용을 제한할 수 있습니다.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-ink">4. 청소년 보호 문의</h2>
              <p>청소년 보호와 관련한 문의는 고객센터 1:1 문의 또는 대표 이메일로 연락해 주세요.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
