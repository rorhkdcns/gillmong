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
  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <DreamDetail
      dream={dream as DbDream}
      isOwner={isOwner}
      isPurchased={isPurchased}
      nickname={nickname}
      isAdmin={isAdmin}
      isLoggedIn={!!user}
    />
  )
}
