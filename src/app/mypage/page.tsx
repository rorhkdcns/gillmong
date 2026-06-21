import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import LogoutButton from './_components/LogoutButton'
import PointTabs from './_components/PointTabs'
import DreamListSection, { type DreamListItem } from './_components/DreamListSection'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
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
    supabase.from('dreams').select('id, title, grade, price, created_at, purchases(price, created_at)').eq('user_id', user.id).eq('is_sold', true).order('created_at', { ascending: false }),
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
    created_at: string
    purchases: Array<{ price: number; created_at: string }>
  }>

  // 리스트용 데이터
  const myDreamsItems: DreamListItem[] = myDreams
    .filter(d => d.created_at)
    .map(d => ({
      id: d.id,
      date: d.created_at as string,
      title: d.title,
      grade: d.grade,
      price: d.price,
      href: `/dream/${d.id}?owner=1`,
      subText: d.is_sold ? '판매완료' : undefined,
    }))

  const savedItems: DreamListItem[] = privateDreams
    .filter(d => d.created_at)
    .map(d => ({
      id: d.id,
      date: d.created_at,
      title: d.title,
      grade: d.grade,
      href: `/saved/${d.id}`,
    }))

  const purchasedItems: DreamListItem[] = purchased
    .flatMap(p => {
      const d = p.dreams as unknown as { id: number; title: string; grade: string; price: number } | null
      if (!d || !p.created_at) return []
      return [{
        id: d.id,
        date: p.created_at,
        title: d.title,
        grade: d.grade,
        price: p.price,
        href: `/dream/${d.id}`,
      }]
    })

  const soldItems: DreamListItem[] = soldDreams.map(d => ({
    id: d.id,
    date: d.created_at,
    title: d.title,
    grade: d.grade,
    price: Math.floor(d.price * 0.9),
    priceLabel: '수령',
    href: `/dream/${d.id}`,
    subText: '판매완료',
  }))

  const nickname     = profile?.nickname ?? (user.user_metadata?.nickname as string) ?? '회원'
  const username     = profile?.username ?? (user.user_metadata?.username as string) ?? ''
  const pointBalance = profile?.points ?? 0
  const isAdmin      = profile?.is_admin ?? false
  const showAdminBtn = isAdmin || username === 'admin' || user.email === 'yoopromise@nate.com'

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      <SiteHeader />

      {/* ───── 본문 ───── */}
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">

          {/* 1. 프로필 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#01273A] text-xl font-bold text-white md:h-16 md:w-16 md:text-2xl">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold text-[#01273A] md:text-2xl">{nickname}</p>
                  <p className="mt-0.5 truncate text-sm text-[#555555]">@{username}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {showAdminBtn && (
                  <a
                    href="/admin"
                    className="rounded-lg bg-[#E07B2A] px-4 py-2 text-sm font-medium text-white transition hover:brightness-90"
                  >
                    관리자 페이지
                  </a>
                )}
                <a
                  href="/mypage/edit"
                  className="rounded-lg bg-[#01273A] px-4 py-2 text-sm font-medium text-white transition hover:brightness-90"
                >
                  정보 변경
                </a>
                <LogoutButton />
              </div>
            </div>
          </section>

          {/* 2. 포인트 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
            {/* 포인트 타이틀 + 잔액 */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#01273A]">포인트</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#E07B2A]">{pointBalance.toLocaleString()}</span>
                <span className="text-base font-medium text-[#555555]">P</span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mb-5 flex gap-3">
              <a href="/charge" className="flex-1 rounded-lg bg-[#E07B2A] py-2.5 text-center text-sm font-semibold text-white transition-all hover:brightness-90">
                포인트 충전
              </a>
              <a href="/mypage/withdrawal" className="flex-1 rounded-lg border border-[#01273A] bg-white py-2.5 text-center text-sm font-semibold text-[#01273A] transition-all hover:bg-[#01273A] hover:text-white">
                출금 신청
              </a>
            </div>

            {/* 포인트 내역 탭 */}
            <PointTabs />
          </section>

          {/* 3. 내가 등록한 꿈 */}
          <DreamListSection title="내가 등록한 꿈" items={myDreamsItems} />

          {/* 4. 내가 저장한 꿈 */}
          <DreamListSection title="내가 저장한 꿈" items={savedItems} />

          {/* 5. 구매한 꿈 */}
          <DreamListSection title="구매한 꿈" items={purchasedItems} />

          {/* 6. 판매 현황 */}
          <DreamListSection title="판매 현황" items={soldItems} />

          {/* 7. 1:1 문의 내역 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#01273A]">1:1 문의 내역</h2>
              <a href="/inquiry" className="text-sm font-medium text-[#6B96A8] hover:underline">+ 문의하기</a>
            </div>
            {myInquiries.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#555555]">문의 내역이 없습니다</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {myInquiries.map((inq) => (
                  <li key={inq.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="mr-3 truncate text-base font-medium text-[#333333]">{inq.title}</span>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${inq.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {inq.status === 'answered' ? '답변완료' : '대기중'}
                        </span>
                        <span className="text-xs text-[#666666]">{formatDate(inq.created_at)}</span>
                      </div>
                    </div>
                    {inq.status === 'answered' && inq.answer && (
                      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="mb-1 text-xs font-bold text-[#6B96A8]">관리자 답변</p>
                        <p className="text-sm text-[#444444] whitespace-pre-wrap">{inq.answer}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 8. 하단 링크 */}
          <div className="flex items-center justify-center gap-6 pb-4 text-sm text-[#555555]">
            <a href="/mypage/withdraw" className="hover:text-red-400 hover:underline">탈퇴하기</a>
          </div>

        </div>
      </main>

      <SiteFooter />

    </div>
  )
}
