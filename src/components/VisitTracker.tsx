'use client'

import { useEffect } from 'react'

// 브라우저 탭 하나당 1번만, "어디서 들어왔는지"를 서버에 알린다. (개인 식별 정보는 보내지 않음)
export default function VisitTracker() {
  useEffect(() => {
    try {
      if (location.pathname.startsWith('/admin')) return
      if (sessionStorage.getItem('gm_visit')) return
      sessionStorage.setItem('gm_visit', '1')
    } catch {
      return
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, search: location.search, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {})
  }, [])
  return null
}
