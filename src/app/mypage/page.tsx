import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import LogoutButton from './_components/LogoutButton'
import PointTabs from './_components/PointTabs'
import DreamCalendar from './_components/DreamCalendar'
import type { CalendarItem } from './_components/DreamCalendar'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-amber-400',
  D: 'bg-orange-400',
  E: 'bg-red-400',
}


function DreamRow({ id, title, grade, price, owner }: { id: number; title: string; grade: string; price: number; owner?: boolean }) {
  const href = owner ? `/dream/${id}?owner=1` : `/dream/${id}`
  return (
    <li className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[grade] ?? 'bg-gray-400'}`}>
          {grade}
        </span>
        <a href={href} className="text-base text-[#333333] hover:text-[#01273A] hover:underline">
          {title}
        </a>
      </div>
      <span className="shrink-0 text-sm font-semibold text-[#E07B2A]">{price.toLocaleString()} P</span>
    </li>
  )
}

function Section({ title, count, children, empty }: { title: string; count: number; children?: React.ReactNode; empty?: boolean }) {
  return (
    <section className="border border-gray-200 bg-white p-5 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">{title}</h2>
        <span className="text-sm text-[#777777]">{count}건</span>
      </div>
      {empty ? (
        <p className="py-6 text-center text-sm text-[#999]">내역이 없습니다</p>
      ) : (
        <ul className="divide-y divide-gray-100">{children}</ul>
      )}
    </section>
  )
}

export const dynamic = 'force-dynamic'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 프로필 + 공개 꿈 + 개인 저장 꿈 + 구매한 꿈 + 판매한 꿈 병렬 조회
  const [profileRes, myDreamsRes, privateDreamsRes, purchasedRes, soldRes, inquiriesRes] = await Promise.all([
    supabase.from('profiles').select('nickname, username, points, is_admin').eq('id', user.id).single(),
    supabase.from('dreams').select('id, title, grade, price, is_sold, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('saved_dreams').select('id, title, grade, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('purchases').select('price, created_at, dreams(id, title, grade, price)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
    supabase.from('dreams').select('id, title, grade, price, purchases(price, created_at)').eq('user_id', user.id).eq('is_sold', true).order('created_at', { ascending: false }),
    supabase.from('inquiries').select('id, title, status, answer, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const profile       = profileRes.data
  const myDreams      = myDreamsRes.data ?? []
  const privateDreams = (privateDreamsRes.data ?? []) as Array<{ id: number; title: string; grade: string; created_at: string }>
  const purchased     = purchasedRes.data ?? []
  const myInquiries   = (inquiriesRes.data ?? []) as Array<{ id: number; title: string; status: string; answer: string | null; created_at: string }>
  const soldDreams = (soldRes.data ?? []) as Array<{
    id: number
    title: string
    grade: string
    price: number
    purchases: Array<{ price: number; created_at: string }>
  }>

  // 달력용 데이터
  const myDreamsCalendar: CalendarItem[] = myDreams
    .filter(d => d.created_at)
    .map(d => ({ id: d.id, title: d.title, grade: d.grade, price: d.price, date: d.created_at as string, href: `/dream/${d.id}?owner=1` }))

  const savedCalendar: CalendarItem[] = privateDreams
    .filter(d => d.created_at)
    .map(d => ({ id: d.id, title: d.title, grade: d.grade, date: d.created_at, href: `/saved/${d.id}` }))

  const purchasedCalendar: CalendarItem[] = purchased
    .flatMap(p => {
      const d = p.dreams as unknown as { id: number; title: string; grade: string; price: number } | null
      if (!d || !p.created_at) return []
      const item: CalendarItem = { id: d.id, title: d.title, grade: d.grade, price: p.price, date: p.created_at, href: `/dream/${d.id}` }
      return [item]
    })

  const nickname     = profile?.nickname ?? (user.user_metadata?.nickname as string) ?? '회원'
  const username     = profile?.username ?? (user.user_metadata?.username as string) ?? ''
  const pointBalance = profile?.points ?? 0
  const isAdmin      = profile?.is_admin ?? false

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      <SiteHeader />

      {/* ───── 본문 ───── */}
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">

          {/* 1. 프로필 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#01273A] text-xl font-bold text-white md:h-16 md:w-16 md:text-2xl">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg text-[#01273A] md:text-xl">{nickname}</p>
                  <p className="mt-0.5 truncate text-sm text-[#777777]">@{username}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isAdmin && (
                  <a
                    href="/admin"
                    className="rounded bg-[#E07B2A] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-90"
                  >
                    어드민
                  </a>
                )}
                <LogoutButton />
              </div>
            </div>
          </section>

          {/* 2. 포인트 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            {/* 포인트 타이틀 + 잔액 */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">포인트</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#E07B2A]">{pointBalance.toLocaleString()}</span>
                <span className="text-sm text-[#777777]">P</span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mb-5 flex gap-3">
              <a href="/charge" className="flex-1 bg-[#E07B2A] py-2.5 text-center text-sm font-semibold text-white transition-all hover:brightness-90">
                포인트 충전
              </a>
              <a href="/mypage/withdrawal" className="flex-1 border border-[#01273A] bg-white py-2.5 text-center text-sm font-semibold text-[#01273A] transition-all hover:bg-[#01273A] hover:text-white">
                출금 신청
              </a>
            </div>

            {/* 포인트 내역 탭 */}
            <PointTabs />
          </section>

          {/* 3. 내가 등록한 꿈 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">내가 등록한 꿈</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#E07B2A]">{myDreams.length}</span>
                <span className="text-sm text-[#777777]">건</span>
              </div>
            </div>
            <DreamCalendar items={myDreamsCalendar} />
          </section>

          {/* 4. 내가 저장한 꿈 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">내가 저장한 꿈</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#E07B2A]">{privateDreams.length}</span>
                <span className="text-sm text-[#777777]">건</span>
              </div>
            </div>
            <DreamCalendar items={savedCalendar} />
          </section>

          {/* 5. 구매한 꿈 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">구매한 꿈</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#E07B2A]">{purchased.length}</span>
                <span className="text-sm text-[#777777]">건</span>
              </div>
            </div>
            <DreamCalendar items={purchasedCalendar} />
          </section>

          {/* 6. 판매 현황 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">판매 현황</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#E07B2A]">{soldDreams.length}</span>
                <span className="text-sm text-[#777777]">건</span>
              </div>
            </div>
            {soldDreams.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#999]">판매 내역이 없습니다</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {soldDreams.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${GRADE_COLOR[d.grade] ?? 'bg-gray-400'}`}>
                        {d.grade}
                      </span>
                      <div>
                        <a href={`/dream/${d.id}`} className="text-base text-[#333333] hover:text-[#01273A] hover:underline">
                          {d.title}
                        </a>
                        <p className="mt-0.5 text-xs text-[#999]">판매완료</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#E07B2A]">{Math.floor(d.price * 0.9).toLocaleString()} P 수령</p>
                      <p className="text-xs text-[#999]">정가 {d.price.toLocaleString()} P</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 7. 1:1 문의 내역 */}
          <section className="border border-gray-200 bg-white p-5 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bg-[#01273A] px-3 py-1 text-sm font-semibold text-white">1:1 문의 내역</h2>
              <a href="/inquiry" className="text-sm text-[#6B96A8] hover:underline">+ 문의하기</a>
            </div>
            {myInquiries.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#999]">문의 내역이 없습니다</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {myInquiries.map((inq) => (
                  <li key={inq.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="truncate mr-3 text-base text-[#333333]">{inq.title}</span>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${inq.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {inq.status === 'answered' ? '답변완료' : '대기중'}
                        </span>
                        <span className="text-xs text-[#999]">{formatDate(inq.created_at)}</span>
                      </div>
                    </div>
                    {inq.status === 'answered' && inq.answer && (
                      <div className="mt-2 rounded bg-gray-50 border border-gray-100 px-3 py-2.5">
                        <p className="mb-1 text-xs font-semibold text-[#6B96A8]">관리자 답변</p>
                        <p className="text-sm text-[#555555] whitespace-pre-wrap">{inq.answer}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 8. 하단 링크 */}
          <div className="flex items-center justify-center gap-6 pb-4 text-sm text-[#777777]">
            <a href="/mypage/edit" className="hover:text-[#01273A] hover:underline">정보 변경</a>
            <span className="text-gray-300">|</span>
            <a href="/mypage/withdraw" className="hover:text-red-400 hover:underline">탈퇴하기</a>
          </div>

        </div>
      </main>

      <SiteFooter />

    </div>
  )
}
