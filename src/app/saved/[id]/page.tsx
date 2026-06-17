import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import type { DbSavedDream } from '@/lib/supabase/types'

const GRADE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: '최고의 길몽' },
  B: { bg: 'bg-blue-500',    text: 'text-blue-600',    label: '좋은 길몽' },
  C: { bg: 'bg-amber-400',   text: 'text-amber-500',   label: '평범한 꿈' },
  D: { bg: 'bg-orange-400',  text: 'text-orange-500',  label: '주의가 필요한 꿈' },
  E: { bg: 'bg-red-400',     text: 'text-red-500',     label: '흉몽의 기운' },
  F: { bg: 'bg-gray-400',    text: 'text-gray-500',    label: '해석 불가' },
}

const TYPE_STYLE: Record<string, string> = {
  길몽: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  흉몽: 'bg-red-50 text-red-500 border-red-200',
  중립: 'bg-gray-100 text-gray-500 border-gray-200',
}

const INTERP_SECTIONS = [
  { pattern: /한국\s*전통\s*해몽\s*관점\s*:/, color: '#01273A' },
  { pattern: /아시아\s*관점[^:]*:/,            color: '#E07B2A' },
  { pattern: /서양\s*심리학적\s*관점\s*:/,     color: '#6B96A8' },
  { pattern: /종합\s*해석\s*:/,                color: '#01273A' },
]

function parseInterpretation(text: string) {
  const lines = text.split('\n')
  const sections: { title: string; content: string; color: string }[] = []
  let cur: { title: string; lines: string[]; color: string } | null = null
  for (const line of lines) {
    const matched = INTERP_SECTIONS.find((s) => s.pattern.test(line.trim()))
    if (matched) {
      if (cur) sections.push({ title: cur.title, content: cur.lines.join('\n').trim(), color: cur.color })
      cur = { title: line.trim(), lines: [], color: matched.color }
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  if (cur) sections.push({ title: cur.title, content: cur.lines.join('\n').trim(), color: cur.color })
  return sections
}

export default async function SavedDreamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: dream } = await supabase
    .from('saved_dreams')
    .select('*')
    .eq('id', id)
    .single()

  if (!dream) notFound()

  const d = dream as DbSavedDream
  const gradeStyle = GRADE_STYLE[d.grade] ?? GRADE_STYLE['C']
  const sections = d.interpretation ? parseInterpretation(d.interpretation) : []

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="mx-auto max-w-[800px]">
          <a href="/mypage" className="inline-flex items-center gap-1 text-sm text-[#777777] hover:text-[#01273A]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            마이페이지로
          </a>
        </div>
      </div>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

            <div className="mb-2 flex justify-center">
              <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-500">개인 저장</span>
            </div>

            {/* 등급 + 유형 */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full ${gradeStyle.bg} shadow-lg`}>
                <span className="text-5xl font-black text-white">{d.grade}</span>
              </div>
              <span className={`text-base font-bold ${gradeStyle.text}`}>{gradeStyle.label}</span>
              {d.type && (
                <span className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${TYPE_STYLE[d.type] ?? TYPE_STYLE['중립']}`}>
                  {d.type}
                </span>
              )}
            </div>

            <h1 className="mb-6 text-center text-2xl font-black leading-snug text-[#01273A]">{d.title}</h1>

            <hr className="mb-6 border-brand-border" />

            {/* 해몽 요약 */}
            {d.summary && (
              <section className="mb-5">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">해몽 요약</h3>
                <div className="rounded-xl border border-[#CCCCCC] bg-amber-50/30 p-4 text-sm leading-relaxed text-brand-body">
                  {d.summary}
                </div>
              </section>
            )}

            {/* 상세 해몽 */}
            {sections.length > 0 && (
              <section className="mb-5">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">상세 해몽</h3>
                <div className="rounded-xl border border-[#CCCCCC] overflow-hidden">
                  {sections.map((sec, i) => (
                    <div key={i}>
                      {i > 0 && <hr style={{ borderColor: '#EEEEEE' }} />}
                      <div className="p-4">
                        <p className="mb-1.5 text-sm font-bold" style={{ color: sec.color }}>{sec.title}</p>
                        <p className="text-sm leading-relaxed text-brand-body whitespace-pre-line">{sec.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 실생활 조언 */}
            {d.advice && (
              <section className="mb-6">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">실생활 조언</h3>
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm leading-relaxed text-brand-body">
                  {d.advice}
                </div>
              </section>
            )}

            {/* 행운의 번호 */}
            {d.lucky_numbers?.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-muted">행운의 추천 번호</h3>
                <div className="flex flex-wrap gap-2">
                  {d.lucky_numbers.map((num) => (
                    <div key={num} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E07B2A] text-base font-black text-white shadow">
                      {num}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <hr className="mb-6 border-brand-border" />

            {/* 꿈 원문 */}
            <section>
              <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">꿈 원문</h3>
              <div className="min-h-32 rounded-xl border border-gray-200 p-5 text-sm leading-relaxed text-[#555555]">
                {d.content}
              </div>
            </section>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
