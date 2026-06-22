'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function submitPartnershipInquiry(data: {
  name: string
  email: string
  company?: string
  phone?: string
  title: string
  content: string
}) {
  const admin = createAdminClient()
  const { error } = await admin.from('partnership_inquiries').insert({
    name:    data.name,
    email:   data.email,
    company: data.company || null,
    phone:   data.phone   || null,
    title:   data.title,
    content: data.content,
    status:  'new',
  })
  if (error) return { error: error.message }
  return { success: true }
}
