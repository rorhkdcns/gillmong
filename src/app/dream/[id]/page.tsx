import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DreamDetail from './_components/DreamDetail'
import type { DbDream } from '@/lib/supabase/types'

export default async function DreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 꿈 데이터 + 작성자 닉네임 조회
  const { data: dream } = await supabase
    .from('dreams')
    .select('*, profiles!left(nickname)')
    .eq('id', id)
    .single()

  if (!dream) notFound()

  const nickname = (dream.profiles as unknown as { nickname: string } | null)?.nickname ?? ''

  // 현재 로그인 사용자
  const { data: { user } } = await supabase.auth.getUser()

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
    />
  )
}
