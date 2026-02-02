'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  PiggyBank,
  Upload,
  BarChart3,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { useState } from 'react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transacties', icon: ArrowLeftRight },
  { href: '/dashboard/categories', label: 'Categorieen', icon: Tags },
  { href: '/dashboard/budgets', label: 'Budgetten', icon: PiggyBank },
  { href: '/dashboard/upload', label: 'Bank Upload', icon: Upload },
  { href: '/dashboard/reports', label: 'Rapportage', icon: BarChart3 },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">FinanceTracker</h1>
            <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">Persoonlijke Financien</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Menu</p>
        {links.map(link => {
          const Icon = link.icon
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] transition-transform duration-200', !active && 'group-hover:scale-110')} />
              <span className="flex-1">{link.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 mt-auto">
        <div className="h-px bg-border/60 mb-3" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl text-[13px] h-10 transition-all duration-200"
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px]" />
          Uitloggen
        </Button>
      </div>
    </>
  )
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-[260px] min-h-screen border-r bg-card/50 backdrop-blur-sm flex-col">
      <SidebarContent />
    </aside>
  )
}

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur-md">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] flex flex-col">
          <SheetTitle className="sr-only">Navigatie</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">F</span>
        </div>
        <h1 className="text-base font-bold tracking-tight">FinanceTracker</h1>
      </div>
    </header>
  )
}
