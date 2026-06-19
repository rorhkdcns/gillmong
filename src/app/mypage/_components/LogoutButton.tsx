'use client'

import { logoutAction } from '@/app/actions'

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="border border-gray-300 px-5 py-2 text-sm text-[#555555] transition-colors hover:border-red-400 hover:text-red-400"
      >
        로그아웃
      </button>
    </form>
  )
}
