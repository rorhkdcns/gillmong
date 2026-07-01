import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: '이용안내 | 길몽상점',
  description: '길몽상점 회원 유형별 서비스 이용 한도 및 혜택 안내',
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border bg-white p-8 shadow-sm ${color}`}>
      <h2 className="mb-6 text-xl font-bold text-[#01273A]">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-[#555555]">{label}</span>
      <span className={`text-right text-sm font-semibold ${highlight ? 'text-[#E07B2A]' : 'text-[#01273A]'}`}>
        {value}
      </span>
    </div>
  )
}

export default function UsageGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl">

          <div className="mb-12 text-center">
            <h1 className="text-3xl font-black text-[#01273A]">이용안내</h1>
            <p className="mt-2 text-sm text-gray-400">Service Usage Guide</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* 일반회원 */}
            <Section title="일반회원 이용한도" color="border-gray-200">
              <Row label="주간 판매 횟수" value="주 2회" />
              <Row label="1회 최대 판매액" value="10만원" />
              <Row label="반기(6개월) 최대 판매액" value="600만원" highlight />
              <Row label="반기 최대 거래건수" value="50건" />
              <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-[#777777]">
                일반회원은 전자금융거래법 및 소득세법에 따른 거래 한도가 적용됩니다.
                한도 초과 시 판매가 자동 제한됩니다.
              </p>
            </Section>

            {/* 사업자회원 */}
            <Section title="사업자회원 이용한도" color="border-amber-200">
              <Row label="판매 횟수 제한" value="제한 없음" highlight />
              <Row label="1회 판매액 제한" value="제한 없음" highlight />
              <Row label="반기 판매액 제한" value="제한 없음" highlight />
              <Row label="세금계산서" value="자동 발급" />
              <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
                사업자회원은 사업자등록번호 검증 후 관리자 승인이 완료되어야 이용 가능합니다.
                승인 후 모든 판매 한도가 해제됩니다.
              </p>
            </Section>

          </div>

          {/* 수수료 안내 */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#01273A] bg-white shadow-sm">
            <div className="bg-[#01273A] px-6 py-4">
              <h2 className="text-base font-bold text-white">수수료 안내</h2>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center justify-between gap-6 sm:gap-12">
                <div className="text-center">
                  <p className="text-xs text-[#999]">판매금액</p>
                  <p className="mt-1 text-2xl font-black text-[#01273A]">100%</p>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                <div className="text-center">
                  <p className="text-xs text-[#999]">서비스 수수료</p>
                  <p className="mt-1 text-2xl font-black text-red-400">– 20%</p>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                <div className="text-center">
                  <p className="text-xs text-[#999]">판매자 수령</p>
                  <p className="mt-1 text-2xl font-black text-[#E07B2A]">80%</p>
                </div>
              </div>
              <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-[#777777]">
                예시: 10,000원 판매 시 → 수수료 2,000원 공제 → 판매자 정산금액 <strong className="text-[#01273A]">8,000원</strong> 즉시 적립
              </p>
            </div>
          </div>

          {/* 비교표 */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-[#01273A] px-6 py-4">
              <h2 className="text-base font-bold text-white">회원 유형 비교</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-[#01273A]">항목</th>
                    <th className="px-6 py-3 text-center font-semibold text-[#01273A]">일반회원</th>
                    <th className="px-6 py-3 text-center font-semibold text-[#E07B2A]">사업자회원</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['주간 판매 횟수',    '주 2회',         '제한 없음'],
                    ['1회 판매액',        '최대 10만원',    '제한 없음'],
                    ['반기 최대 판매액',  '600만원',        '제한 없음'],
                    ['반기 거래건수',     '최대 50건',      '제한 없음'],
                    ['세금계산서',        '미발급',         '자동 발급'],
                    ['가입 승인',         '즉시',           '관리자 검토 후'],
                  ].map(([label, general, business]) => (
                    <tr key={label} className="hover:bg-gray-50">
                      <td className="px-6 py-3.5 text-[#555555]">{label}</td>
                      <td className="px-6 py-3.5 text-center text-[#333333]">{general}</td>
                      <td className="px-6 py-3.5 text-center font-semibold text-[#E07B2A]">{business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 안내 */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-[#01273A]">이용 관련 문의</h2>
            <p className="text-sm leading-relaxed text-[#555555]">
              회원 유형 변경 또는 이용한도 관련 문의는{' '}
              <a href="/inquiry" className="font-semibold text-[#01273A] underline underline-offset-2 hover:brightness-75">1:1 문의</a>
              를 통해 연락해주세요.
            </p>
          </div>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
