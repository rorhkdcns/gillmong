import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = 'https://www.gillmong.com'

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const admin = createAdminClient()
  const { data: notices } = await admin
    .from('notices')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const items = (notices ?? [])
    .map((n) => {
      const pubDate = new Date(n.created_at).toUTCString()
      const link    = `${SITE_URL}/notice/${n.id}`
      const desc    = escapeXml((n.content ?? '').slice(0, 200))
      return `
  <item>
    <title>${escapeXml(n.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${desc}</description>
  </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>길몽상점 공지사항</title>
    <link>${SITE_URL}</link>
    <description>길몽상점 최신 공지사항을 구독하세요</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
