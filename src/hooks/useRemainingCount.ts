'use client'

import { useState, useEffect, useCallback } from 'react'

export function useRemainingCount() {
  const [remaining, setRemaining] = useState<number | null>(null)

  const fetchRemaining = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch('/api/dream-remaining', { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      const r = typeof data.remaining === 'number' ? data.remaining : null
      setRemaining(r)
      return r
    } catch {
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
