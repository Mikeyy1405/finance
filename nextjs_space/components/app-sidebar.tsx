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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transacties', icon: ArrowLeftRight },
  { href: '/dashboard/categories', label: 'Categorieen', icon: Tags },
  { href: '/dashboard/budgets', label: 'Budgetten', icon: PiggyBank },
  { href: '/dashboard/upload', label: 'Bank Upload', icon: Upload },
  { href: '/dashboard/reports', label: 'Rapportage', icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <aside className="w-64 min-h-screen border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">FinanceTracker</h1>
        <p className="text-xs text-muted-foreground mt-1">Persoonlijke Financien</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => {
          const Icon = link.icon
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Uitloggen
        </Button>
      </div>
    </aside>
  )
}
