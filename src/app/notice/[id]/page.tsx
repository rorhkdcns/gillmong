import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import SiteHeader from '@/components/SiteHeader'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: notice } = await admin
    .from('notices')
    .select('id, title, content, is_pinned, created_at')
    .eq('id', id)
    .single()

  if (!notice) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4">
            <a href="/notice" className="text-sm text-gray-400 hover:text-[#01273A]">← 공지사항 목록</a>
          </div>
          <article className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 border-b border-gray-100 pb-6">
              {notice.is_pinned && (
                <span className="mb-2 inline-block rounded bg-[#01273A] px-2 py-0.5 text-[10px] font-bold text-white">공지</span>
              )}
              <h1 className="text-2xl font-black text-[#01273A]">{notice.title}</h1>
              <p className="mt-2 text-sm text-gray-400">{formatDate(notice.created_at)}</p>
            </div>
            <div className="prose max-w-none text-[15px] leading-relaxed text-[#444444] whitespace-pre-line">
              {notice.content}
            </div>
          </article>
        </div>
      </main>
      <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-5 text-[#555555]">
            {[['이용약관','/terms'],['개인정보처리방침','/privacy'],['공지사항','/notice'],['FAQ','/faq'],['고객센터','/support'],['1:1문의','/inquiry']].map(([label,href]) => (
              <a key={label} href={href} className="hover:underline">{label}</a>
            ))}
          </div>
          <p className="mt-4 text-gray-400">© 2026 길몽상점. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
