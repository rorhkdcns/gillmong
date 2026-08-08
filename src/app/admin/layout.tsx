import { requireAdminPage } from '@/lib/supabase/adminAuth'
import AdminSidebar from './_components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()

  return (
    <div className="flex h-screen overflow-hidden bg-brand-page">
      <AdminSidebar />
      {/* overflowAnchor: 'none' — 이 안에서 폼이 열리며 콘텐츠가 위쪽에 크게 삽입될 때
          브라우저의 스크롤 앵커링이 우리가 의도한 scrollTo(top:0) 호출을 되돌려버리는
          현상(스크롤된 만큼 되레 아래로 밀림)을 막기 위함. 실측으로 확인한 문제라 임의로
          제거하지 말 것. */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0" style={{ overflowAnchor: 'none' }}>
        {children}
      </main>
    </div>
  )
}
