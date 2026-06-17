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
  Coins,
  TrendingUp,
  CreditCard,
  Star,
  ChevronRight,
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

const pointPolicies = [
  { Icon: BrainCircuit, service: 'AI 정밀 해몽',  policy: '고정 포인트 차감',       detail: '전용 분석 리포트 전체 포함' },
  { Icon: ShoppingCart, service: '꿈 구매 (길몽)', policy: '시장 가치 기반 산정',     detail: '희소성 및 등급에 따른 차등 적용' },
  { Icon: TrendingUp,   service: '꿈 판매 리워드', policy: '판매가의 일정 비율 적립', detail: '판매 완료 시 즉시 정산 지급' },
  { Icon: CreditCard,   service: '포인트 충전',    policy: '유료 결제 시 충전',       detail: '다양한 간편 결제 수단 지원' },
]

const grades = [
  { grade: 'A', label: '최상위 등급', desc: '드물게 나타나는 최고의 길몽',     color: 'bg-emerald-500' },
  { grade: 'B', label: '상위 등급',   desc: '뚜렷한 행운의 전조가 보이는 꿈', color: 'bg-blue-500' },
  { grade: 'C', label: '일반 등급',   desc: '긍정적인 의미를 담은 좋은 꿈',   color: 'bg-amber-400' },
]


export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]" style={{ fontSize: '18px' }}>

      <SiteHeader activePath="/guide" />

      {/* ───── 1. 꿈의 가치를 거래합니다 ───── */}
      <section className="bg-[#01273A] px-8 py-32 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 tracking-widest text-[#FFD700]" style={{ fontSize: '16px' }}>GILLMONG SERVICE</p>
          <h1 className="mb-6 leading-tight text-white" style={{ fontSize: '48px' }}>꿈의 가치를 거래합니다</h1>
          <p className="mx-auto mb-20 max-w-xl leading-relaxed text-white/90" style={{ fontSize: '18px' }}>
            당신의 꿈이 하나의 상품이 됩니다
          </p>
          <div className="grid gap-8 text-left md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
              <Sparkles className="mb-6 text-[#FFD700]" size={32} strokeWidth={1.5} />
              <h3 className="mb-4 text-white" style={{ fontSize: '22px' }}>AI 해몽 분석</h3>
              <p className="leading-relaxed text-white/85" style={{ fontSize: '17px' }}>
                당신의 꿈을 GILLMONG AI가 한국 전통·동양·서양 심리학적 관점으로 정밀 분석하여 운세 등급과 해몽을 제공합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
              <Coins className="mb-6 text-[#FFD700]" size={32} strokeWidth={1.5} />
              <h3 className="mb-4 text-white" style={{ fontSize: '22px' }}>포인트 기반 거래</h3>
              <p className="leading-relaxed text-white/85" style={{ fontSize: '17px' }}>
                좋은 꿈을 판매하여 리워드를 얻거나, 필요한 행운을 포인트로 구매할 수 있는 독창적인 마켓 플랫폼입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 2. 서비스 프로세스 ───── */}
      <section className="bg-white px-8 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-20 text-center">
            <p className="mb-4 tracking-widest text-[#555555]" style={{ fontSize: '16px' }}>HOW IT WORKS</p>
            <h2 className="text-[#01273A]" style={{ fontSize: '32px' }}>GILLMONG 서비스 프로세스</h2>
          </div>
          <div className="flex items-start justify-center">
            {processSteps.map((item, i) => (
              <Fragment key={i}>
                <div className="flex flex-1 flex-col items-center px-4 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#01273A]">
                    <item.Icon size={28} strokeWidth={1.5} className="text-[#FFD700]" />
                  </div>
                  <p className="mb-1 text-[#E07B2A]" style={{ fontSize: '16px' }}>{item.step}</p>
                  <p className="mb-3 text-[#01273A]" style={{ fontSize: '18px' }}>{item.title}</p>
                  <p className="leading-relaxed text-[#333333]" style={{ fontSize: '16px' }}>{item.desc}</p>
                </div>
                {i < processSteps.length - 1 && (
                  <div className="hidden shrink-0 items-center pt-9 text-[#888888] md:flex">
                    <ChevronRight size={20} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 3. 행운을 구매하세요 ───── */}
      <section className="bg-[#F2F2F2] px-8 py-28">
        <div className="mx-auto max-w-4xl md:flex md:items-start md:gap-20">
          <div className="mb-12 md:mb-0 md:w-1/2">
            <p className="mb-4 tracking-widest text-[#555555]" style={{ fontSize: '16px' }}>BUY LUCK</p>
            <h2 className="mb-5 text-[#01273A]" style={{ fontSize: '32px' }}>행운을 구매하세요</h2>
            <p className="mb-10 leading-relaxed text-[#333333]" style={{ fontSize: '18px' }}>
              꿈 구경하기 메뉴에서 등록된 꿈들을 탐색하세요.
            </p>
            <ul className="flex flex-col gap-6">
              {[
                '상징, 요약, 운세 등급 확인',
                '해몽 및 행운 번호 제공',
                '포인트 결제 시 해몽 전문 열람',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E07B2A] text-white"
                    style={{ fontSize: '14px' }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-[#333333]" style={{ fontSize: '18px' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#01273A] p-10 shadow-sm md:w-1/2">
            <p className="mb-6 text-white" style={{ fontSize: '20px' }}>구매 흐름</p>
            {['꿈 마켓 탐색', '운세 등급 & 상징 확인', '포인트 결제', '행운 상징물 소유'].map((step, i) => (
              <div key={i} className="flex items-center gap-5 border-b border-white/10 py-5 last:border-0">
                <span className="text-[#FFD700]" style={{ fontSize: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="text-white" style={{ fontSize: '18px' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 4. 당신의 꿈이 수익이 됩니다 ───── */}
      <section className="bg-white px-8 py-28">
        <div className="mx-auto max-w-4xl md:flex md:flex-row-reverse md:items-start md:gap-20">
          <div className="mb-12 md:mb-0 md:w-1/2">
            <p className="mb-4 tracking-widest text-[#555555]" style={{ fontSize: '16px' }}>SELL YOUR DREAM</p>
            <h2 className="mb-10 text-[#01273A]" style={{ fontSize: '32px' }}>당신의 꿈이<br />수익이 됩니다</h2>
            <ul className="flex flex-col gap-6">
              {['상세한 꿈 일기 작성', 'AI 해몽 생성', '마켓 등록 및 리워드'].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#01273A] text-white"
                    style={{ fontSize: '14px' }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-[#333333]" style={{ fontSize: '18px' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#01273A] p-10 md:w-1/2">
            <p className="mb-6 text-white" style={{ fontSize: '20px' }}>판매 흐름</p>
            {['꿈 일기 상세 작성', 'AI 정밀 해몽 실행', '마켓 가격 설정', '판매 & 리워드 수령'].map((step, i) => (
              <div key={i} className="flex items-center gap-5 border-b border-white/10 py-5 last:border-0">
                <span className="text-[#FFD700]" style={{ fontSize: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="text-white" style={{ fontSize: '18px' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 5. 안심하고 거래하세요 ───── */}
      <section className="bg-[#F2F2F2] px-8 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-20 text-center">
            <p className="mb-4 tracking-widest text-[#555555]" style={{ fontSize: '16px' }}>TRUST & SAFETY</p>
            <h2 className="text-[#01273A]" style={{ fontSize: '32px' }}>안심하고 거래하세요</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {trustCards.map((card, i) => (
              <div key={i} className="rounded-2xl bg-white p-10 shadow-sm">
                <card.Icon className="mb-8 text-[#E07B2A]" size={32} strokeWidth={1.5} />
                <p className="mb-4 text-[#01273A]" style={{ fontSize: '20px' }}>{card.title}</p>
                <p className="leading-relaxed text-[#333333]" style={{ fontSize: '17px' }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 6. 포인트 정책 안내 ───── */}
      <section className="bg-white px-8 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-20 text-center">
            <p className="mb-4 tracking-widest text-[#555555]" style={{ fontSize: '16px' }}>POINT POLICY</p>
            <h2 className="text-[#01273A]" style={{ fontSize: '32px' }}>포인트 정책 안내</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-[#01273A] text-white">
                  <th className="px-8 py-5 text-left" style={{ fontSize: '17px' }}>서비스</th>
                  <th className="px-8 py-5 text-left" style={{ fontSize: '17px' }}>정책</th>
                  <th className="px-8 py-5 text-left" style={{ fontSize: '17px' }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {pointPolicies.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <row.Icon size={20} strokeWidth={1.5} className="text-[#E07B2A]" />
                        <span className="text-[#01273A]" style={{ fontSize: '17px' }}>{row.service}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#333333]" style={{ fontSize: '16px' }}>{row.policy}</td>
                    <td className="px-8 py-5 text-[#333333]" style={{ fontSize: '16px' }}>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── 7. 운세 등급 시스템 ───── */}
      <section className="bg-[#F2F2F2] px-8 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-20 text-center">
            <p className="mb-4 tracking-widest text-[#555555]" style={{ fontSize: '16px' }}>GRADE SYSTEM</p>
            <h2 className="text-[#01273A]" style={{ fontSize: '32px' }}>운세 등급 시스템</h2>
          </div>
          <div className="mb-16 flex justify-center">
            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-[#01273A] shadow-xl">
              <Star size={22} strokeWidth={1.5} className="mb-1 text-[#FFD700]" />
              <span className="tracking-widest text-[#FFD700]" style={{ fontSize: '14px' }}>EXCEL</span>
              <span className="text-white/80" style={{ fontSize: '14px' }}>GILLMONG</span>
              <span className="text-white" style={{ fontSize: '20px' }}>GRADE</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {grades.map((g, i) => (
              <div key={i} className="flex items-center gap-6 rounded-2xl bg-white p-8 shadow-sm">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${g.color} text-white shadow`} style={{ fontSize: '24px' }}>
                  {g.grade}
                </div>
                <div>
                  <p className="mb-1 text-[#01273A]" style={{ fontSize: '18px' }}>{g.label}</p>
                  <p className="text-[#333333]" style={{ fontSize: '16px' }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
