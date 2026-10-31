'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Result = { success?: boolean; error?: string }

/** 저장함의 꿈을 마켓에 판매 등록한다. keepCopy=true면 저장함에도 그대로 남겨둔다. */
export async function sellSavedDream(savedId: number, categorySlug: string, price: number, keepCopy = true): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  if (!Number.isInteger(price) || price < 5000) return { error: '최소 5,000원 이상 입력해주세요.' }
  if (price % 100 !== 0) return { error: '판매금액은 100원 단위로 입력해주세요.' }

  const admin = createAdminClient()
  const { data: saved } = await admin.from('saved_dreams').select('*').eq('id', savedId).eq('user_id', user.id).single()
  if (!saved) return { error: '저장된 꿈을 찾을 수 없습니다.' }

  const { data: cat } = await admin.from('categories').select('id, slug').eq('slug', categorySlug).eq('domain', 'dream').eq('is_active', true).maybeSingle()
  if (!cat) return { error: '카테고리를 선택해주세요.' }

  const { error } = await admin.from('dreams').insert({
    user_id: user.id,
    title: saved.title,
    content: saved.content,
    original_text: saved.original_text ?? null,
    content_mode: saved.content_mode ?? 'ai',
    summary: saved.summary,
    grade: saved.grade,
    dream_type: saved.type,
    interpretation: saved.interpretation,
    advice: saved.advice,
    category: cat.slug,
    category_id: cat.id,
    price,
    lucky_numbers: saved.lucky_numbers,
    is_adult: saved.is_adult ?? false,
  })
  if (error) return { error: `등록 오류: ${error.message}` }

  if (!keepCopy) await admin.from('saved_dreams').delete().eq('id', savedId).eq('user_id', user.id)
  revalidatePath('/mypage')
  revalidatePath('/')
  return { success: true }
}

/**
 * 내가 등록한 꿈을 저장함에 넣는다.
 * - 아직 안 팔린 꿈: 마켓에서 내리고 저장함으로 이동
 * - 이미 팔린 꿈: 마켓/구매자 기록은 그대로 두고 저장함에 사본만 추가
 */
export async function saveMyDream(dreamId: number): Promise<Result & { moved?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const admin = createAdminClient()
  const { data: d } = await admin.from('dreams').select('*').eq('id', dreamId).eq('user_id', user.id).single()
  if (!d) return { error: '꿈을 찾을 수 없습니다.' }

  const { error } = await admin.from('saved_dreams').insert({
    user_id: user.id,
    title: d.title,
    content: d.content,
    original_text: d.original_text ?? null,
    content_mode: d.content_mode ?? 'ai',
    summary: d.summary,
    grade: d.grade,
    type: d.dream_type,
    interpretation: d.interpretation,
    advice: d.advice,
    lucky_numbers: d.lucky_numbers,
    is_adult: d.is_adult ?? false,
  })
  if (error) return { error: `저장 오류: ${error.message}` }

  let moved = false
  if (!d.is_sold) {
    const { count } = await admin.from('purchases').select('id', { count: 'exact', head: true }).eq('dream_id', dreamId)
    if ((count ?? 0) === 0) {
      const { error: delErr } = await admin.from('dreams').delete().eq('id', dreamId).eq('user_id', user.id)
      if (!delErr) moved = true
    }
  }
  revalidatePath('/mypage')
  revalidatePath('/')
  return { success: true, moved }
}
