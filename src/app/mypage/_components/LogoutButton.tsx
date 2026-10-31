'use client'

import { logoutAction } from '@/app/actions'

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-[3px] border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        로그아웃
      </button>
    </form>
  )
}
