'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitInquiry(
  title: string,
  content: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('inquiries').insert({
    user_id: user.id,
    title:   title.trim(),
    content: content.trim(),
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getMyInquiries() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('inquiries')
    .select('id, title, status, answer, created_at, answered_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}
