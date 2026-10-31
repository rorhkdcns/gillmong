import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteFooter from '@/components/SiteFooter'
import type { DbSavedDream } from '@/lib/supabase/types'
import { GRADE_INFO, TYPE_STYLE, parseInterpretation, type Grade } from '@/lib/dreamDisplay'

export default async function SavedDreamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')
  const user = session.user

  const { data: dream } = await supabase
    .from('saved_dreams')
    .select('*')
    .eq('id', id)
    .single()

  if (!dream) notFound()

  const d = dream as DbSavedDream
  const gradeStyle = GRADE_INFO[d.grade as Grade] ?? GRADE_INFO['C']
  const sections = d.interpretation ? parseInterpretation(d.interpretation) : []

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F2]">

      <div className="border-b border-gray-100 bg-white px-6 py-3">
        <div className="mx-auto max-w-[800px]">
          <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-[#6B605A] hover:text-[#231C17]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            마이페이지로
          </Link>
        </div>
      </div>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-7">

            <div className="mb-2 flex justify-center">
              <span className="rounded-[3px] bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-500">개인 저장</span>
            </div>

            {/* 등급 + 유형 */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className={`flex h-24 w-24 items-center justify-center rounded-[3px] ${gradeStyle.badgeBg} shadow-lg`}>
                <span className="font-display text-5xl font-extrabold">{d.grade}</span>
              </div>
              <span className={`text-base font-bold ${gradeStyle.text}`}>{gradeStyle.label}</span>
              {d.type && (
                <span className={`rounded-[3px] border px-3 py-0.5 text-sm font-semibold ${TYPE_STYLE[d.type] ?? TYPE_STYLE['중립']}`}>
                  {d.type}
                </span>
              )}
            </div>

            <h1 className="mb-6 text-center text-2xl font-extrabold leading-snug text-[#231C17]">{d.title}</h1>

            <hr className="mb-6 border-brand-border" />

            {/* 해몽 요약 */}
            {d.summary && (
              <section className="mb-5">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">해몽 요약</h3>
                <div className="rounded-xl border border-[#EADFD8] bg-amber-50/30 p-4 text-sm leading-relaxed text-brand-body">
                  {d.summary}
                </div>
              </section>
            )}

            {/* 상세 해몽 */}
            {sections.length > 0 && (
              <section className="mb-5">
                <h3 className="mb-2 text-base font-bold uppercase tracking-wider text-brand-muted">상세 해몽</h3>
                <div className="rounded-xl border border-[#EADFD8] overflow-hidden">
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
                <div className="rounded-xl border border-brand-primary-border bg-brand-primary-light/40 p-4 text-sm leading-relaxed text-brand-body">
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
                    <div key={num} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C23A18] text-base font-extrabold text-white shadow">
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
              <div className="min-h-32 rounded-xl border border-gray-200 p-5 text-sm leading-relaxed text-[#6B605A]">
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
