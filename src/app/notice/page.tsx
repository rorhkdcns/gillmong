import { createAdminClient } from '@/lib/supabase/admin'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default async function NoticePage() {
  const admin = createAdminClient()
  const { data: notices } = await admin
    .from('notices')
    .select('id, title, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at',  { ascending: false })

  const list = notices ?? []

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-[#01273A]">공지사항</h1>
            <p className="mt-2 text-sm text-gray-400">Notice</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {list.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">등록된 공지사항이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {list.map((n) => (
                  <li key={n.id}>
                    <a
                      href={`/notice/${n.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {n.is_pinned && (
                          <span className="shrink-0 rounded bg-[#01273A] px-2 py-0.5 text-[10px] font-bold text-white">공지</span>
                        )}
                        <span className="truncate text-base text-[#333333]">{n.title}</span>
                      </div>
                      <span className="shrink-0 text-sm text-gray-400">{formatDate(n.created_at)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
