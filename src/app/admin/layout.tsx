import { requireAdminPage } from '@/lib/supabase/adminAuth'
import AdminSidebar from './_components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()

  return (
    <div className="flex h-screen overflow-hidden bg-brand-page">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}
