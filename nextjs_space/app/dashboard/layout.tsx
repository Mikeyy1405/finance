import { AppSidebar, MobileHeader } from '@/components/app-sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-8 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
