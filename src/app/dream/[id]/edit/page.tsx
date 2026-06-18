import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DbDream } from '@/lib/supabase/types'
import DreamEditForm from './_components/DreamEditForm'

export default async function DreamEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')
  const user = session.user

  const { data: dream } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .single()

  if (!dream) notFound()
  if (dream.user_id !== user.id) notFound()
  if (dream.is_sold) redirect(`/dream/${id}`)

  return <DreamEditForm dream={dream as DbDream} />
}
