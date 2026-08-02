'use client'

import { useState } from 'react'

interface Props {
  src: string | null
  alt: string
  className: string
  onError?: () => void
}

// 쿠팡 이미지는 상품이 내려가면 깨진다 — onError로 회색 플레이스홀더로 대체한다.
// next/image는 쓰지 않는다: 쿠팡 CDN 도메인이 여러 개라 remotePatterns 관리가 번거롭고,
// 이 컴포넌트가 쓰이는 화면(어드민, 제휴상품 카드)은 최적화 이점도 크지 않다.
export default function ImageThumbnail({ src, alt, className, onError }: Props) {
  const [failed, setFailed] = useState(false)
  const broken = !src || failed

  if (broken) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2">
          <path
            fillRule="evenodd"
            d="M1.5 6A2.25 2.25 0 013.75 3.75h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zm2.25-.75a.75.75 0 00-.75.75v10.94l4.72-4.72a.75.75 0 011.06 0l3.72 3.72 3.22-3.22a.75.75 0 011.06 0l3.22 3.22V6a.75.75 0 00-.75-.75H3.75z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setFailed(true)
        onError?.()
      }}
    />
  )
}
