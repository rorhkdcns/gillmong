'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // signOut 실패해도 반드시 이동
    } finally {
      window.location.href = '/'
    }
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
