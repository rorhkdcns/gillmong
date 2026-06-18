'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="border border-gray-300 px-5 py-2 text-sm text-[#555555] transition-colors hover:border-red-400 hover:text-red-400"
    >
      로그아웃
    </button>
  )
}
