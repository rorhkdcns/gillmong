'use client'

import { useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const FAQS = [
  {
    category: '서비스 이용',
    items: [
      {
        q: '길몽상점은 어떤 서비스인가요?',
        a: '길몽상점은 AI 해몽 분석 결과를 마켓에서 사고팔 수 있는 꿈 거래 플랫폼입니다. 꿈 내용을 입력하면 AI가 등급·해몽·행운번호를 분석하고, 그 결과를 포인트로 거래할 수 있습니다.',
      },
      {
        q: '꿈 분석은 하루에 몇 번 가능한가요?',
        a: '로그인 회원 기준으로 하루 최대 3회 꿈 분석이 가능합니다. 마켓 등록과 개인 저장을 합산하여 3회입니다.',
      },
      {
        q: '분석 결과의 정확성을 보장하나요?',
        a: '꿈 감정 결과(등급, 해몽, 행운번호 등)는 AI가 한국 전통·동양·서양 심리학적 관점을 종합하여 제공하는 오락·참고 목적의 콘텐츠입니다. 결과의 정확성을 보증하지 않으며 실생활의 중요 결정에 활용하지 않도록 주의하세요.',
      },
    ],
  },
  {
    category: '포인트 · 결제',
    items: [
      {
        q: '포인트는 어떻게 충전하나요?',
        a: '마이페이지 → 포인트 충전 버튼을 통해 충전할 수 있습니다. 충전 방법 및 최소 금액은 충전 페이지에서 확인하세요.',
      },
      {
        q: '꿈 판매 수익은 어떻게 받나요?',
        a: '판매가의 80%가 포인트로 지급됩니다(수수료 20%). 적립된 포인트는 마이페이지 → 출금 신청을 통해 현금으로 받을 수 있습니다.',
      },
      {
        q: '구매한 꿈은 환불이 가능한가요?',
        a: '구매 완료된 꿈은 원칙적으로 환불이 불가합니다. 단, 서비스 결함으로 인한 경우 고객센터로 문의해주세요.',
      },
      {
        q: '포인트 유효기간이 있나요?',
        a: '포인트 자체의 유효기간은 없습니다. 단, 회원 탈퇴 시 잔여 포인트는 소멸되며 환급되지 않습니다.',
      },
    ],
  },
  {
    category: '꿈 마켓',
    items: [
      {
        q: '꿈 등록 시 최소 판매가는 얼마인가요?',
        a: '최소 5,000P이며, 100P 단위로 설정하실 수 있습니다.',
      },
      {
        q: '등록한 꿈을 삭제할 수 있나요?',
        a: '판매 완료 전(미판매 상태)에만 삭제가 가능합니다. 이미 거래가 성사된 꿈은 삭제할 수 없습니다.',
      },
      {
        q: '개인 저장과 마켓 등록의 차이는 무엇인가요?',
        a: '개인 저장은 분석 결과를 나만 볼 수 있도록 비공개로 보관하는 기능입니다. 마켓 등록은 다른 사용자가 포인트를 내고 구매할 수 있도록 공개 판매하는 것입니다.',
      },
    ],
  },
  {
    category: '계정 · 보안',
    items: [
      {
        q: '비밀번호를 잊어버렸어요.',
        a: '로그인 페이지 하단의 "비밀번호 찾기"를 통해 재설정할 수 있습니다. 가입 시 등록한 이메일로 재설정 링크가 발송됩니다.',
      },
      {
        q: '닉네임이나 비밀번호를 변경하고 싶어요.',
        a: '마이페이지 하단 "정보 변경" 메뉴에서 닉네임과 비밀번호를 변경할 수 있습니다.',
      },
      {
        q: '회원 탈퇴는 어떻게 하나요?',
        a: '마이페이지 하단 "탈퇴하기"를 통해 탈퇴 신청을 할 수 있습니다. 탈퇴 시 등록된 꿈, 포인트, 구매 내역 등 모든 데이터가 삭제되며 복구할 수 없습니다.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="text-base font-medium text-[#01273A]">
          <span className="mr-2 font-bold text-[#E07B2A]">Q.</span>{q}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
          <p className="text-sm leading-relaxed text-[#555555]">
            <span className="mr-2 font-bold text-[#6B96A8]">A.</span>{a}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-[#01273A]">자주 묻는 질문</h1>
            <p className="mt-2 text-sm text-gray-400">FAQ · Frequently Asked Questions</p>
          </div>
          <div className="space-y-6">
            {FAQS.map((section) => (
              <div key={section.category} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-[#01273A] px-6 py-3">
                  <h2 className="text-sm font-bold text-white">{section.category}</h2>
                </div>
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-base text-[#555555]">원하는 답변을 찾지 못하셨나요?</p>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href="/support" className="rounded-xl border border-[#01273A] px-6 py-2.5 text-sm font-semibold text-[#01273A] hover:bg-[#01273A] hover:text-white transition-colors">
                고객센터 안내
              </a>
              <a href="/inquiry" className="rounded-xl bg-[#01273A] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-90 transition-all">
                1:1 문의하기
              </a>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
