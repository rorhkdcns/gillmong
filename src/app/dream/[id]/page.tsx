import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DreamDetail from './_components/DreamDetail'
import type { DbDream } from '@/lib/supabase/types'

export default async function DreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 꿈 데이터 조회 (JOIN 없이 - JOIN 실패 시 dream이 null이 되는 문제 방지)
  const { data: dream } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .single()

  if (!dream) notFound()

  // 현재 로그인 사용자
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // 작성자 닉네임 + 현재 유저 is_admin 함께 조회
  const admin = createAdminClient()
  const [{ data: authorProfile }, { data: myProfile }] = await Promise.all([
    admin.from('profiles').select('nickname').eq('id', dream.user_id).single(),
    user ? admin.from('profiles').select('is_admin').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])
  const nickname = authorProfile?.nickname ?? ''
  const isAdmin  = !!(myProfile as { is_admin?: boolean } | null)?.is_admin

  const isOwner = !!user && user.id === dream.user_id

  // 구매 여부 확인
  let isPurchased = false
  if (user && !isOwner) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('dream_id', dream.id)
      .single()
    isPurchased = !!purchase
  }

  // 구매 전(작성자·구매자·관리자가 아닌 경우)에는 블러 처리되는 본문을 서버에서 아예 비워서 보낸다.
  // CSS 블러만으로는 개발자도구로 원문이 그대로 보이기 때문. 길이만 비슷한 자리표시 글자로 대체한다.
  const canView = isOwner || isPurchased || isAdmin
  const mask = (text: string | null | undefined) =>
    text ? '꿈 내용은 구매 후 열람할 수 있어요. '.repeat(Math.max(1, Math.min(8, Math.ceil(text.length / 60)))).trim() : ''
  const safeDream = canView
    ? (dream as DbDream)
    : ({ ...dream, content: mask(dream.content), interpretation: mask(dream.interpretation), advice: mask(dream.advice) } as DbDream)

  return (
    <DreamDetail
      dream={safeDream}
      isOwner={isOwner}
      isPurchased={isPurchased}
      nickname={nickname}
      isAdmin={isAdmin}
      isLoggedIn={!!user}
    />
  )
}
