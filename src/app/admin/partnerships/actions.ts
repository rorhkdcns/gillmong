'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getPartnershipInquiries() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partnership_inquiries')
    .select('id, name, email, company, phone, title, content, status, admin_note, created_at')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function updatePartnershipStatus(
  id: number,
  status: 'new' | 'reviewing' | 'done',
  admin_note: string,
) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('partnership_inquiries')
    .update({ status, admin_note })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}
