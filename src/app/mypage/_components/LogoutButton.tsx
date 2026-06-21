'use client'

import { logoutAction } from '@/app/actions'

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="bg-[#E07B2A] px-4 py-2 text-sm font-medium text-white transition hover:brightness-90"
      >
        로그아웃
      </button>
    </form>
  )
}
