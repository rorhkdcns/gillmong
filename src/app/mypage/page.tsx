import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteFooter from '@/components/SiteFooter'
import LogoutButton from './_components/LogoutButton'
import PointTabs from './_components/PointTabs'
import DreamListSection, { type DreamListItem } from './_components/DreamListSection'
import EscrowOrders from './_components/EscrowOrders'
import { getMyOrders } from '@/app/actions'
import { getActiveCategories } from '@/lib/categories'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export const dynamic = 'force-dynamic'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const categories = (await getActiveCategories()).map((c) => ({ slug: c.slug, name: c.name }))

  // 프로필 + 공개 꿈 + 개인 저장 꿈 + 구매한 꿈 + 판매한 꿈 + 에스크로 주문 병렬 조회
  const [profileRes, myDreamsRes, privateDreamsRes, purchasedRes, soldRes, inquiriesRes, escrowOrders] = await Promise.all([
    supabase.from('profiles').select('nickname, username, points, is_admin').eq('id', user.id).single(),
    supabase.from('dreams').select('id, title, grade, price, is_sold, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('saved_dreams').select('id, title, grade, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('purchases').select('price, created_at, dreams(id, title, grade, price)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
    supabase.from('dreams').select('id, title, grade, price, created_at, purchases(price, created_at)').eq('user_id', user.id).eq('is_sold', true).order('created_at', { ascending: false }),
    supabase.from('inquiries').select('id, title, status, answer, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    getMyOrders(),
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
      action: 'save' as const,
      actionLabel: d.is_sold ? '저장함에 복사' : '저장함으로',
    }))

  const savedItems: DreamListItem[] = privateDreams
    .filter(d => d.created_at)
    .map(d => ({
      id: d.id,
      date: d.created_at,
      title: d.title,
      grade: d.grade,
      href: `/saved/${d.id}`,
      action: 'sell' as const,
      actionLabel: '판매하기',
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
    price: Math.floor(d.price * 0.8),
    priceLabel: '수령',
    href: `/dream/${d.id}`,
    subText: '판매완료',
    action: 'save' as const,
    actionLabel: '저장함에 복사',
  }))

  const nickname     = profile?.nickname ?? (user.user_metadata?.nickname as string) ?? '회원'
  const username     = profile?.username ?? (user.user_metadata?.username as string) ?? ''
  const pointBalance = profile?.points ?? 0
  const isAdmin      = profile?.is_admin ?? false
  const showAdminBtn = isAdmin || username === 'admin' || user.email === 'yoopromise@nate.com'

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F2]">

      {/* ───── 본문 ───── */}
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">

          {/* 1. 프로필 + 요약 */}
          <section className="overflow-hidden rounded-[4px] bg-brand-ink text-white">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="flex min-w-0 items-center gap-4">
                <div className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] bg-brand-gold text-2xl font-extrabold text-brand-ink md:h-16 md:w-16 md:text-3xl">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold md:text-2xl">{nickname}</p>
                  <p className="mt-0.5 truncate text-sm text-white/60">@{username}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a href="/mypage/edit" className="rounded-[3px] bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90">정보 변경</a>
                {showAdminBtn && (
                  <a href="/admin" className="rounded-[3px] bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover">관리자 페이지</a>
                )}
                <LogoutButton />
              </div>
            </div>
            <nav aria-label="내 활동 바로가기" className="grid grid-cols-4 divide-x divide-white/15 border-t border-white/15 text-center">
              {[
                { id: 'my-dreams', label: '등록', n: myDreamsItems.length },
                { id: 'my-saved', label: '저장', n: savedItems.length },
                { id: 'my-purchased', label: '구매', n: purchasedItems.length },
                { id: 'my-sold', label: '판매', n: soldItems.length },
              ].map((t) => (
                <a key={t.id} href={`#${t.id}`} className="py-3.5 transition-colors hover:bg-white/10">
                  <strong className="font-display block text-xl">{t.n}</strong>
                  <span className="text-xs text-white/60">{t.label}</span>
                </a>
              ))}
            </nav>
          </section>

          {/* 2. 판매금액 */}
          <section className="rounded-[4px] border border-brand-line bg-white p-5 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">판매금액</h2>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-brand-primary">{pointBalance.toLocaleString()}</span>
                <span className="text-base font-medium text-brand-ink-soft">원</span>
              </div>
            </div>

            {pointBalance > 0 && (
              <div className="mb-4 rounded-[3px] border border-grade-d-bg bg-grade-d-bg/50 px-3 py-2.5 text-xs text-grade-d-fg">
                보유 포인트 잔액은 구매 시 사용 가능합니다. 충전 서비스는 종료되었습니다.
              </div>
            )}

            <div className="mb-5">
              <a href="/mypage/withdrawal" className="block w-full rounded-[3px] border-2 border-brand-ink bg-white py-2.5 text-center text-sm font-bold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white">
                출금 신청
              </a>
            </div>

            <PointTabs />
          </section>

          {/* 3. 내가 등록한 꿈 */}
          <div id="my-dreams" className="scroll-mt-20"><DreamListSection title="내가 등록한 꿈" items={myDreamsItems} /></div>

          {/* 4. 내가 저장한 꿈 */}
          <div id="my-saved" className="scroll-mt-20"><DreamListSection title="내가 저장한 꿈" items={savedItems} categories={categories} /></div>

          {/* 5. 구매한 꿈 */}
          <div id="my-purchased" className="scroll-mt-20"><DreamListSection title="구매한 꿈" items={purchasedItems} /></div>

          {/* 5-1. 결제 주문 내역 (에스크로) */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <EscrowOrders orders={escrowOrders as any} />

          {/* 6. 판매 현황 */}
          <div id="my-sold" className="scroll-mt-20"><DreamListSection title="판매 현황" items={soldItems} /></div>

          {/* 7. 1:1 문의 내역 */}
          <section className="rounded-[4px] border border-brand-line bg-white p-5 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">1:1 문의 내역</h2>
              <a href="/inquiry" className="text-sm font-medium text-[#9A8F88] hover:underline">+ 문의하기</a>
            </div>
            {myInquiries.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6B605A]">문의 내역이 없습니다</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {myInquiries.map((inq) => (
                  <li key={inq.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="mr-3 truncate text-base font-medium text-[#3A322C]">{inq.title}</span>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-[3px] px-2.5 py-0.5 text-xs font-semibold ${inq.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {inq.status === 'answered' ? '답변완료' : '대기중'}
                        </span>
                        <span className="text-xs text-[#6B605A]">{formatDate(inq.created_at)}</span>
                      </div>
                    </div>
                    {inq.status === 'answered' && inq.answer && (
                      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="mb-1 text-xs font-bold text-[#9A8F88]">관리자 답변</p>
                        <p className="text-sm text-[#3A322C] whitespace-pre-wrap">{inq.answer}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 8. 하단 링크 */}
          <div className="flex items-center justify-center gap-6 pb-4 text-sm text-[#6B605A]">
            <a href="/mypage/withdraw" className="hover:text-red-400 hover:underline">탈퇴하기</a>
          </div>

        </div>
      </main>

      <SiteFooter />

    </div>
  )
}
