import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import LogoutButton from './_components/LogoutButton'
import PointTabs from './_components/PointTabs'

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
    <section className="border border-gray-200 bg-white p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg text-[#01273A]">{title}</h2>
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

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // 프로필 + 등록한 꿈 + 구매한 꿈 + 판매한 꿈(purchases 테이블) 병렬 조회
  const [profileRes, myDreamsRes, purchasedRes, soldRes] = await Promise.all([
    supabase.from('profiles').select('nickname, username, points').eq('id', user.id).single(),
    supabase.from('dreams').select('id, title, grade, price, is_sold').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('purchases').select('price, created_at, dreams(id, title, grade, price)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
    supabase.from('dreams').select('id, title, grade, price, purchases(price, created_at)').eq('user_id', user.id).eq('is_sold', true).order('created_at', { ascending: false }),
  ])

  const profile    = profileRes.data
  const myDreams   = myDreamsRes.data ?? []
  const purchased  = purchasedRes.data ?? []
  const soldDreams = (soldRes.data ?? []) as Array<{
    id: number
    title: string
    grade: string
    price: number
    purchases: Array<{ price: number; created_at: string }>
  }>

  const nickname     = profile?.nickname ?? (user.user_metadata?.nickname as string) ?? '회원'
  const username     = profile?.username ?? (user.user_metadata?.username as string) ?? ''
  const pointBalance = profile?.points ?? 0

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">

      <SiteHeader />

      {/* ───── 본문 ───── */}
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* 1. 프로필 */}
          <section className="border border-gray-200 bg-white p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#01273A] text-2xl font-bold text-white">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl text-[#01273A]">{nickname}</p>
                  <p className="mt-0.5 text-sm text-[#777777]">@{username}</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </section>

          {/* 2. 포인트 */}
          <section className="border border-gray-200 bg-white p-8">
            <h2 className="mb-5 text-lg text-[#01273A]">포인트</h2>

            {/* 잔액 + 버튼 */}
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-[#E07B2A]">{pointBalance.toLocaleString()}</span>
                <span className="mb-1 text-base text-[#777777]">P</span>
              </div>
              <div className="flex gap-3">
                <a href="/mypage/charge" className="bg-[#E07B2A] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-90">
                  포인트 충전
                </a>
                <a href="/mypage/withdrawal" className="border border-[#01273A] bg-white px-5 py-2 text-sm font-semibold text-[#01273A] transition-all hover:bg-[#01273A] hover:text-white">
                  출금 신청
                </a>
              </div>
            </div>

            {/* 포인트 내역 탭 */}
            <PointTabs />
          </section>

          {/* 3. 내가 등록한 꿈 */}
          <Section title="내가 등록한 꿈" count={myDreams.length} empty={myDreams.length === 0}>
            {myDreams.map((d) => <DreamRow key={d.id} id={d.id} title={d.title} grade={d.grade} price={d.price} owner />)}
          </Section>

          {/* 4. 내가 저장한 꿈 */}
          <Section title="내가 저장한 꿈" count={0} empty>
          </Section>

          {/* 5. 구매한 꿈 */}
          <Section title="구매한 꿈" count={purchased.length} empty={purchased.length === 0}>
            {purchased.map((p) => {
              const d = p.dreams as unknown as { id: number; title: string; grade: string; price: number } | null
              if (!d) return null
              return <DreamRow key={d.id} id={d.id} title={d.title} grade={d.grade} price={p.price} />
            })}
          </Section>

          {/* 6. 판매 현황 */}
          <section className="border border-gray-200 bg-white p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg text-[#01273A]">판매 현황</h2>
              <span className="text-sm text-[#777777]">{soldDreams.length}건</span>
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

          {/* 7. 하단 링크 */}
          <div className="flex items-center justify-center gap-6 pb-4 text-sm text-[#777777]">
            <a href="/mypage/edit" className="hover:text-[#01273A] hover:underline">정보 변경</a>
            <span className="text-gray-300">|</span>
            <a href="/mypage/withdraw" className="hover:text-red-400 hover:underline">탈퇴하기</a>
          </div>

        </div>
      </main>

      {/* ───── 푸터 ───── */}
      <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-1 text-[#555555]">
            <span>상호명: 티에이치 컴퍼니</span>
            <span>대표자: 유태현</span>
            <span>사업자등록번호: 795-44-00873</span>
            <span>통신판매업신고: 제2026-수원팔달-0211호</span>
            <span>주소: 경기도 수원시 팔달구 정조로900번길 23, 104호</span>
            <span className="mt-2">고객센터: 이메일 문의 (gillmong@nate.com) · 평일 10:00 ~ 18:00</span>
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <div className="flex flex-wrap gap-5 text-[#555555]">
              {[
                { label: '이용약관',        href: '/terms' },
                { label: '개인정보처리방침', href: '/privacy' },
                { label: '이용안내',        href: '/guide' },
                { label: '제휴문의',        href: '#' },
              ].map(({ label, href }) => (
                <a key={label} href={href} className="hover:underline">{label}</a>
              ))}
            </div>
            <p className="text-gray-400">© 2024 길몽상점. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
