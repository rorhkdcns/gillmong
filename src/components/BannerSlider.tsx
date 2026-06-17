'use client'

import { useEffect, useState, useCallback } from 'react'

interface Banner {
  id: number
  image_url: string
  link_url: string
}

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [banners.length, next])

  if (banners.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '16 / 5' }}>
      {banners.map((b, i) => (
        <a
          key={b.id}
          href={b.link_url}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          tabIndex={i === current ? 0 : -1}
          aria-hidden={i !== current}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.image_url}
            alt={`배너 ${i + 1}`}
            className="h-full w-full object-cover"
          />
        </a>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="이전 배너"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white text-xl leading-none hover:bg-black/60 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="다음 배너"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white text-xl leading-none hover:bg-black/60 transition-colors"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`배너 ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
