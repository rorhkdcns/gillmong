import SiteFooter from '@/components/SiteFooter'
import { getSiteInfo } from '@/lib/siteSettings'

export default async function SupportPage() {
  const info = await getSiteInfo()
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F2]">
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold text-[#231C17]">고객센터</h1>
            <p className="mt-2 text-sm text-gray-400">Customer Support</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 이메일 문의 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#231C17]/10">
                <svg className="h-6 w-6 text-[#231C17]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#231C17]">이메일 문의</h2>
              <p className="mb-4 text-sm leading-relaxed text-[#6B605A]">
                서비스 이용 중 불편하신 점이나 문의사항을 이메일로 보내주세요.
                영업일 기준 1~2일 내에 답변드립니다.
              </p>
              <a
                href={`mailto:${info.email}`}
                className="inline-block rounded-xl bg-[#231C17] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-90 transition-all"
              >
                {info.email}
              </a>
            </div>

            {/* 운영시간 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C23A18]/10">
                <svg className="h-6 w-6 text-[#C23A18]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#231C17]">운영시간</h2>
              <div className="space-y-2 text-sm text-[#6B605A]">
                <div className="flex justify-between">
                  <span>평일 (월~금)</span>
                  <span className="font-semibold">{info.hours.replace(/^평일\s*/, "")}</span>
                </div>
                <div className="flex justify-between">
                  <span>점심시간</span>
                  <span className="font-semibold">{info.lunch.replace(/^점심\s*/, "")}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>주말 · 공휴일</span>
                  <span>휴무</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                운영시간 외 문의는 이메일 또는 1:1 문의를 이용해주세요.
              </p>
            </div>

            {/* 1:1 문의 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#9A8F88]/10">
                <svg className="h-6 w-6 text-[#9A8F88]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#231C17]">1:1 문의</h2>
              <p className="mb-4 text-sm leading-relaxed text-[#6B605A]">
                로그인 후 1:1 문의를 남기시면 담당자가 확인 후 답변드립니다.
                문의 내역은 마이페이지에서 확인하실 수 있습니다.
              </p>
              <a
                href="/inquiry"
                className="inline-block rounded-xl border border-[#231C17] px-5 py-2.5 text-sm font-semibold text-[#231C17] hover:bg-[#231C17] hover:text-white transition-colors"
              >
                문의하기
              </a>
            </div>

            {/* FAQ */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#231C17]">자주 묻는 질문</h2>
              <p className="mb-4 text-sm leading-relaxed text-[#6B605A]">
                서비스 이용에 관한 자주 묻는 질문과 답변을 정리했습니다.
                문의 전 먼저 확인해보세요.
              </p>
              <a
                href="/faq"
                className="inline-block rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#6B605A] hover:border-[#231C17] hover:text-[#231C17] transition-colors"
              >
                FAQ 보기
              </a>
            </div>
          </div>

          {/* 사업자 정보 */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
            <h2 className="mb-4 text-base font-bold text-[#231C17]">사업자 정보</h2>
            <div className="grid gap-2 text-sm text-[#6B605A] sm:grid-cols-2">
              <div><span className="font-medium text-[#3A322C]">상호명</span>: 티에이치 컴퍼니</div>
              <div><span className="font-medium text-[#3A322C]">대표자</span>: 유태현</div>
              <div><span className="font-medium text-[#3A322C]">사업자등록번호</span>: 795-44-00873</div>
              <div><span className="font-medium text-[#3A322C]">통신판매업신고</span>: 제2026-수원팔달-0211호</div>
              <div className="sm:col-span-2"><span className="font-medium text-[#3A322C]">주소</span>: 경기도 수원시 팔달구 정조로900번길 23, 104호</div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
