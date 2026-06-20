'use client'

import { useState, useEffect, useCallback } from 'react'

export function useRemainingCount() {
  const [remaining, setRemaining] = useState<number | null>(null)

  const fetchRemaining = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch('/api/dream-remaining', { cache: 'no-store' })
      if (!res.ok) {
        console.error('[dream-remaining] HTTP 오류:', res.status)
        return null
      }
      const data = await res.json()
      console.log('[dream-remaining] 응답:', data)
      const r = typeof data.remaining === 'number' ? data.remaining : null
      setRemaining(r)
      return r
    } catch (e) {
      console.error('[dream-remaining] fetch 실패:', e)
      return null
    }
  }, [])

  useEffect(() => {
    fetchRemaining()
    window.addEventListener('dream-analyzed', fetchRemaining)
    return () => window.removeEventListener('dream-analyzed', fetchRemaining)
  }, [fetchRemaining])

  return { remaining, fetchRemaining }
}
