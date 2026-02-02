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
  Camera,
  Heart,
  Weight,
  Droplets,
  Moon,
  Dumbbell,
  Pill,
  Users,
  CalendarDays,
  ClipboardList,
  ShoppingCart,
  UtensilsCrossed,
  Target,
  CheckCircle2,
  BookOpen,
  Car,
  CreditCard,
  ChevronDown,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { useState } from 'react'

interface NavSection {
  label: string
  icon: React.ElementType
  gradient: string
  links: { href: string; label: string; icon: React.ElementType }[]
}

const sections: NavSection[] = [
  {
    label: 'Overzicht',
    icon: LayoutDashboard,
    gradient: 'from-violet-500 to-purple-600',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Financien',
    icon: PiggyBank,
    gradient: 'from-blue-500 to-blue-700',
    links: [
      { href: '/dashboard/transactions', label: 'Transacties', icon: ArrowLeftRight },
      { href: '/dashboard/categories', label: 'Categorieen', icon: Tags },
      { href: '/dashboard/budgets', label: 'Budgetten', icon: PiggyBank },
      { href: '/dashboard/upload', label: 'Bank Upload', icon: Upload },
      { href: '/dashboard/receipts', label: 'Bonnetjes', icon: Camera },
      { href: '/dashboard/reports', label: 'Rapportage', icon: BarChart3 },
    ],
  },
  {
    label: 'Gezondheid',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    links: [
      { href: '/dashboard/health', label: 'Overzicht', icon: Heart },
      { href: '/dashboard/health/weight', label: 'Gewicht', icon: Weight },
      { href: '/dashboard/health/water', label: 'Water', icon: Droplets },
      { href: '/dashboard/health/sleep', label: 'Slaap', icon: Moon },
      { href: '/dashboard/health/workouts', label: 'Workouts', icon: Dumbbell },
      { href: '/dashboard/health/medications', label: 'Medicijnen', icon: Pill },
    ],
  },
  {
    label: 'Gezin & Huis',
    icon: Users,
    gradient: 'from-amber-500 to-orange-600',
    links: [
      { href: '/dashboard/family', label: 'Overzicht', icon: Users },
      { href: '/dashboard/family/calendar', label: 'Kalender', icon: CalendarDays },
      { href: '/dashboard/family/tasks', label: 'Taken', icon: ClipboardList },
      { href: '/dashboard/family/groceries', label: 'Boodschappen', icon: ShoppingCart },
      { href: '/dashboard/family/meals', label: 'Maaltijden', icon: UtensilsCrossed },
    ],
  },
  {
    label: 'Doelen',
    icon: Target,
    gradient: 'from-emerald-500 to-green-600',
    links: [
      { href: '/dashboard/goals', label: 'Doelen', icon: Target },
      { href: '/dashboard/goals/habits', label: 'Gewoontes', icon: CheckCircle2 },
      { href: '/dashboard/goals/journal', label: 'Dagboek', icon: BookOpen },
    ],
  },
  {
    label: 'Bezittingen',
    icon: Car,
    gradient: 'from-slate-500 to-slate-700',
    links: [
      { href: '/dashboard/assets/vehicles', label: 'Voertuigen', icon: Car },
      { href: '/dashboard/assets/subscriptions', label: 'Abonnementen', icon: CreditCard },
    ],
  },
const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transacties', icon: ArrowLeftRight },
  { href: '/dashboard/categories', label: 'Categorieen', icon: Tags },
  { href: '/dashboard/budgets', label: 'Budgetten', icon: PiggyBank },
  { href: '/dashboard/upload', label: 'Bank Upload', icon: Upload },
  { href: '/dashboard/receipts', label: 'Bonnetjes', icon: Camera },
  { href: '/dashboard/reports', label: 'Rapportage', icon: BarChart3 },
  { href: '/dashboard/collaborators', label: 'Samenwerken', icon: Users },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleSection(label: string) {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">LifeManager</h1>
            <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">Beheer je leven</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {sections.map(section => {
          const SectionIcon = section.icon
          const isCollapsed = collapsed[section.label]
          const hasActiveLink = section.links.some(l => pathname === l.href)

          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-widest transition-all duration-200',
                  hasActiveLink
                    ? 'text-foreground'
                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                )}
              >
                <div className={cn(
                  'h-5 w-5 rounded-md bg-gradient-to-br flex items-center justify-center',
                  section.gradient
                )}>
                  <SectionIcon className="h-3 w-3 text-white" />
                </div>
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown className={cn(
                  'h-3 w-3 transition-transform duration-200',
                  isCollapsed && '-rotate-90'
                )} />
              </button>

              {!isCollapsed && (
                <div className="ml-3 space-y-0.5 mt-0.5 mb-2">
                  {section.links.map(link => {
                    const Icon = link.icon
                    const active = pathname === link.href
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onNavigate}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
                          active
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('h-[16px] w-[16px] transition-transform duration-200', !active && 'group-hover:scale-110')} />
                        <span className="flex-1">{link.label}</span>
                        {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
          <span className="text-white font-bold text-xs">L</span>
        </div>
        <h1 className="text-base font-bold tracking-tight">LifeManager</h1>
      </div>
    </header>
  )
}
