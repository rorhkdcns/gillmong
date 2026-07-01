import { Fragment } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import {
  Sparkles,
  ShoppingCart,
  BrainCircuit,
  Tag,
  Gift,
  Lock,
  Globe,
  BadgeCheck,
  TrendingUp,
  CreditCard,
  Star,
  ChevronRight,
  BookOpen,
} from 'lucide-react'

const processSteps = [
  { step: '01', title: '꿈 등록', desc: '꿈의 내용을 상세히 기록합니다', Icon: BrainCircuit },
  { step: '02', title: 'AI 분석', desc: 'GILLMONG AI가 정밀 해몽합니다', Icon: Sparkles },
  { step: '03', title: '판매 등록', desc: '마켓에 꿈을 등록합니다', Icon: Tag },
  { step: '04', title: '리워드 획득', desc: '판매 완료 시 즉시 정산됩니다', Icon: Gift },
]

const trustCards = [
  {
    Icon: Lock,
    title: '원문 비공개 원칙',
    desc: '판매된 꿈의 원문은 구매자에게만 공개됩니다. 꿈 일기의 프라이버시를 철저히 보호합니다.',
  },
  {
    Icon: Globe,
    title: '글로벌 DB 기반',
    desc: '전 세계 문화권의 꿈 상징 데이터를 기반으로 AI가 정밀 분석합니다.',
  },
  {
    Icon: BadgeCheck,
    title: '독점적 소유권',
    desc: '구매한 꿈의 행운 상징물은 구매자만의 독점 소유가 됩니다.',
  },
]

const paymentPolicies = [
  { Icon: BrainCircuit, service: 'AI 정밀 해몽',  policy: '고정 요금 결제',      detail: '전용 분석 리포트 전체 포함' },
  { Icon: ShoppingCart, service: '꿈 구매 (길몽)', policy: '시장 가치 기반 산정', detail: '희소성 및 등급에 따라 자동 적용' },
  { Icon: TrendingUp,   service: '꿈 판매 정산',   policy: '판매가의 80% 정산',   detail: '구매확정 또는 결제 후 7일 경과 시 자동 정산 (수수료 20%)' },
]

const grades = [
  { grade: 'A', label: '최상위 등급', desc: '드물게 나타나는 최고의 길몽',       color: 'bg-emerald-500' },
  { grade: 'B', label: '상위 등급',   desc: '뚜렷한 행운의 전조가 보이는 꿈',   color: 'bg-blue-500'    },
  { grade: 'C', label: '일반 등급',   desc: '긍정적인 의미를 담은 좋은 꿈',     color: 'bg-amber-400'   },
  { grade: 'D', label: '주의 등급',   desc: '경고·부담·위험을 암시하는 꿈',     color: 'bg-orange-500'  },
  { grade: 'E', label: '흉몽 등급',   desc: '두려움·상실·불안이 담긴 꿈',       color: 'bg-red-500'     },
]


export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      <SiteHeader />

      {/* ───── 1. 꿈의 가치를 거래합니다 ───── */}
      <section className="bg-[#01273A] px-5 py-14 text-white md:px-8 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs tracking-widest text-[#FFD700] md:mb-5 md:text-base">GILLMONG SERVICE</p>
          <h1 className="mb-4 text-3xl leading-tight text-white md:mb-6 md:text-5xl">꿈의 가치를 거래합니다</h1>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/90 md:mb-20 md:text-lg">
            당신의 꿈이 하나의 상품이 됩니다
          </p>
          <div className="grid gap-5 text-left md:grid-cols-2 md:gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10">
              <Sparkles className="mb-4 text-[#FFD700] md:mb-6" size={28} strokeWidth={1.5} />
              <h3 className="mb-3 text-lg text-white md:mb-4 md:text-xl">AI 해몽 분석</h3>
              <p className="text-sm leading-relaxed text-white/85 md:text-base">
                당신의 꿈을 GILLMONG AI가 한국 전통·동양·서양 심리학적 관점으로 정밀 분석하여 운세 등급과 해몽을 제공합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10">
              <CreditCard className="mb-4 text-[#FFD700] md:mb-6" size={28} strokeWidth={1.5} />
              <h3 className="mb-3 text-lg text-white md:mb-4 md:text-xl">안전 결제 시스템</h3>
              <p className="text-sm leading-relaxed text-white/85 md:text-base">
                좋은 꿈을 판매해 수익을 얻거나, 필요한 행운을 안전하게 결제로 구매할 수 있는 독창적인 마켓 플랫폼입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 2. 한국 꿈 문화 ───── */}
      <section className="bg-[#F7F2E8] px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center md:mb-14">
            <p className="mb-3 text-xs tracking-widest text-[#9B7D4B] md:mb-4 md:text-base">KOREAN DREAM CULTURE</p>
            <h2 className="text-2xl text-[#01273A] md:text-3xl">대한민국 고유의 문화, 꿈을 사고팔다</h2>
          </div>
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#E8D9B8] bg-white/70 p-7 md:p-12">
            <BookOpen className="mb-5 text-[#9B7D4B] md:mb-8" size={28} strokeWidth={1.5} />
            <p className="mb-4 text-sm leading-relaxed text-[#444444] md:text-base md:leading-loose">
              예로부터 한국에는 좋은 꿈, 특히 복권 당첨이나 큰 행운을 암시하는 &quot;길몽&quot;을 사고파는 풍습이 있었습니다.
              태몽을 나눠주고 답례를 받거나, 복권을 사기 전 좋은 꿈을 미리 구매하는 문화 —
              꿈은 오랫동안 한국인의 삶 속에서 하나의 가치있는 자산으로 여겨져 왔습니다.
            </p>
            <p className="text-sm leading-relaxed text-[#444444] md:text-base md:leading-loose">
              GILLMONG은 한국 고유의 이 전통을 디지털로 옮겨와,
              누구나 안전하고 투명하게 꿈을 거래할 수 있는 플랫폼을 만들었습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ───── 3. 서비스 프로세스 ───── */}
      <section className="bg-white px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center md:mb-20">
            <p className="mb-3 text-xs tracking-widest text-[#555555] md:mb-4 md:text-base">HOW IT WORKS</p>
            <h2 className="text-2xl text-[#01273A] md:text-3xl">GILLMONG 서비스 프로세스</h2>
          </div>
          {/* 모바일: 2×2 그리드 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:hidden">
            {processSteps.map((item, i) => (
              <div key={i} className="flex flex-col items-center px-1 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#01273A]">
                  <item.Icon size={22} strokeWidth={1.5} className="text-[#FFD700]" />
                </div>
                <p className="mb-1 text-xs text-[#E07B2A]">{item.step}</p>
                <p className="mb-2 text-sm font-semibold text-[#01273A]">{item.title}</p>
                <p className="text-xs leading-relaxed text-[#555555]">{item.desc}</p>
              </div>
            ))}
          </div>
          {/* 데스크탑: 가로 flex + 화살표 */}
          <div className="hidden md:flex md:items-start md:justify-center">
            {processSteps.map((item, i) => (
              <Fragment key={i}>
                <div className="flex flex-1 flex-col items-center px-4 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#01273A]">
                    <item.Icon size={28} strokeWidth={1.5} className="text-[#FFD700]" />
                  </div>
                  <p className="mb-1 text-base text-[#E07B2A]">{item.step}</p>
                  <p className="mb-3 text-lg text-[#01273A]">{item.title}</p>
                  <p className="text-base leading-relaxed text-[#333333]">{item.desc}</p>
                </div>
                {i < processSteps.length - 1 && (
                  <div className="flex shrink-0 items-center pt-9 text-[#888888]">
                    <ChevronRight size={20} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 4. 행운을 구매하세요 ───── */}
      <section className="bg-[#F2F2F2] px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl md:flex md:items-start md:gap-20">
          <div className="mb-8 text-center md:mb-0 md:w-1/2 md:text-left">
            <p className="mb-3 text-xs tracking-widest text-[#555555] md:mb-4 md:text-base">BUY LUCK</p>
            <h2 className="mb-4 text-2xl text-[#01273A] md:mb-5 md:text-3xl">행운을 구매하세요</h2>
            <p className="mb-8 text-sm leading-relaxed text-[#333333] md:mb-10 md:text-lg">
              꿈 구경하기 메뉴에서 등록된 꿈들을 탐색하세요.
            </p>
            <ul className="flex flex-col gap-4 text-left md:gap-6">
              {[
                '상징, 요약, 운세 등급 확인',
                '해몽 및 행운 번호 제공',
                '결제 완료 시 해몽 전문 즉시 열람',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 md:gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E07B2A] text-xs text-white md:h-7 md:w-7">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-[#333333] md:text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 rounded-2xl bg-[#01273A] p-6 shadow-sm md:mt-0 md:w-1/2 md:p-10">
            <p className="mb-4 text-base text-white md:mb-6 md:text-xl">구매 흐름</p>
            {['꿈 마켓 탐색', '운세 등급 & 상징 확인', '직접 결제', '행운 상징물 소유'].map((step, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-white/10 py-4 last:border-0 md:gap-5 md:py-5">
                <span className="text-sm text-[#FFD700] md:text-base">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm text-white md:text-lg">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 5. 당신의 꿈이 수익이 됩니다 ───── */}
      <section className="bg-white px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl md:flex md:flex-row-reverse md:items-start md:gap-20">
          <div className="mb-8 text-center md:mb-0 md:w-1/2 md:text-left">
            <p className="mb-3 text-xs tracking-widest text-[#555555] md:mb-4 md:text-base">SELL YOUR DREAM</p>
            <h2 className="mb-8 text-2xl text-[#01273A] md:mb-10 md:text-3xl">
              당신의 꿈이<br />수익이 됩니다
            </h2>
            <ul className="flex flex-col gap-4 text-left md:gap-6">
              {['상세한 꿈 일기 작성', 'AI 해몽 생성', '마켓 등록 및 리워드'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 md:gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#01273A] text-xs text-white md:h-7 md:w-7">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-[#333333] md:text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 rounded-2xl bg-[#01273A] p-6 md:mt-0 md:w-1/2 md:p-10">
            <p className="mb-4 text-base text-white md:mb-6 md:text-xl">판매 흐름</p>
            {['꿈 일기 상세 작성', 'AI 정밀 해몽 실행', '마켓 가격 설정', '판매 & 리워드 수령'].map((step, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-white/10 py-4 last:border-0 md:gap-5 md:py-5">
                <span className="text-sm text-[#FFD700] md:text-base">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm text-white md:text-lg">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 6. 안심하고 거래하세요 ───── */}
      <section className="bg-[#F2F2F2] px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center md:mb-20">
            <p className="mb-3 text-xs tracking-widest text-[#555555] md:mb-4 md:text-base">TRUST & SAFETY</p>
            <h2 className="text-2xl text-[#01273A] md:text-3xl">안심하고 거래하세요</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 md:gap-8">
            {trustCards.map((card, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm md:p-10">
                <card.Icon className="mb-4 text-[#E07B2A] md:mb-8" size={28} strokeWidth={1.5} />
                <p className="mb-3 text-lg text-[#01273A] md:mb-4 md:text-xl">{card.title}</p>
                <p className="text-sm leading-relaxed text-[#333333] md:text-base">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 7. 결제 및 정산 정책 안내 ───── */}
      <section className="bg-white px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center md:mb-20">
            <p className="mb-3 text-xs tracking-widest text-[#555555] md:mb-4 md:text-base">PAYMENT POLICY</p>
            <h2 className="text-2xl text-[#01273A] md:text-3xl">결제 및 정산 정책 안내</h2>
          </div>

          {/* 모바일: 카드형 */}
          <div className="flex flex-col gap-4 md:hidden">
            {paymentPolicies.map((row, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <row.Icon size={18} strokeWidth={1.5} className="shrink-0 text-[#E07B2A]" />
                  <span className="font-semibold text-[#01273A]">{row.service}</span>
                </div>
                <p className="mb-1 text-sm text-[#333333]">{row.policy}</p>
                <p className="text-xs text-[#777777]">{row.detail}</p>
              </div>
            ))}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-[#01273A] text-white">
                  <th className="px-8 py-5 text-left text-base">서비스</th>
                  <th className="px-8 py-5 text-left text-base">정책</th>
                  <th className="px-8 py-5 text-left text-base">상세</th>
                </tr>
              </thead>
              <tbody>
                {paymentPolicies.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <row.Icon size={20} strokeWidth={1.5} className="text-[#E07B2A]" />
                        <span className="text-base text-[#01273A]">{row.service}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-base text-[#333333]">{row.policy}</td>
                    <td className="px-8 py-5 text-base text-[#333333]">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── 8. 운세 등급 시스템 ───── */}
      <section className="bg-[#F2F2F2] px-5 py-14 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center md:mb-20">
            <p className="mb-3 text-xs tracking-widest text-[#555555] md:mb-4 md:text-base">GRADE SYSTEM</p>
            <h2 className="text-2xl text-[#01273A] md:text-3xl">운세 등급 시스템</h2>
          </div>
          <div className="mb-8 flex justify-center md:mb-16">
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#01273A] shadow-xl md:h-40 md:w-40">
              <Star size={20} strokeWidth={1.5} className="mb-1 text-[#FFD700]" />
              <span className="text-xs tracking-widest text-[#FFD700]">EXCEL</span>
              <span className="text-xs text-white/80">GILLMONG</span>
              <span className="text-lg text-white">GRADE</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
            {grades.map((g, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm md:p-6">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white shadow md:h-14 md:w-14 md:text-2xl ${g.color}`}>
                  {g.grade}
                </div>
                <p className="mb-1 text-sm font-semibold text-[#01273A] md:text-base">{g.label}</p>
                <p className="text-xs leading-relaxed text-[#555555] md:text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
