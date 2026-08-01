'use client'

interface Props {
  productId: string
  href: string
  className?: string
  children: React.ReactNode
}

export default function AffiliateProductLink({ productId, href, className, children }: Props) {
  function handleClick() {
    const body = JSON.stringify({ productId })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/affiliate/click', body)
    } else {
      fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
    // 클릭 집계 실패 여부와 무관하게 링크 이동은 그대로 진행 (await 하지 않음)
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}
