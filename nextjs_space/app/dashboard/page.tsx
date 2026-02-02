'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown, ArrowRightLeft } from 'lucide-react'

interface DashboardData {
  totalIncome: number
  totalExpenses: number
  totalTransfers: number
  balance: number
  categoryBreakdown: Array<{
    categoryId: string | null
    category: { name: string; icon: string | null; color: string | null } | null
    total: number
    count: number
  }>
  recentTransactions: Array<{
    id: string
    date: string
    description: string
    amount: number
    type: string
    category: { name: string; icon: string | null; color: string | null } | null
  }>
  trend: Array<{ month: number; year: number; income: number; expenses: number; transfers: number }>
  budgetStatus: Array<{
    id: string
    amount: number
    spent: number
    remaining: number
    percentage: number
    category: { name: string; icon: string | null; color: string | null }
  }>
}

const summaryCards = [
  { key: 'income', label: 'Inkomsten', icon: TrendingUp, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
  { key: 'expenses', label: 'Uitgaven', icon: TrendingDown, color: 'red', gradient: 'from-red-500 to-rose-600' },
  { key: 'transfers', label: 'Overboekingen', icon: ArrowRightLeft, color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  { key: 'balance', label: 'Balans', icon: Wallet, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
] as const

export default function DashboardPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch(`/api/dashboard?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(setData)
  }, [month, year])

  function getValue(key: string) {
    if (!data) return '...'
    switch (key) {
      case 'income': return formatCurrency(data.totalIncome)
      case 'expenses': return formatCurrency(data.totalExpenses)
      case 'transfers': return formatCurrency(data.totalTransfers)
      case 'balance': return formatCurrency(data.balance)
      default: return '0'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overzicht van je financien</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[130px] h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px] h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const y = now.getFullYear() - 2 + i
                return <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon
          return (
            <Card key={card.key} className="premium-shadow border-border/50 overflow-hidden relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`} />
              <CardContent className="p-4 md:p-5 relative">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                    <p className="text-lg md:text-2xl font-bold tracking-tight truncate">
                      {getValue(card.key)}
                    </p>
                  </div>
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Category breakdown */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Uitgaven per categorie</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.categoryBreakdown.map((item, i) => {
                  const pct = data.totalExpenses > 0 ? (item.total / data.totalExpenses) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{item.category?.icon} {item.category?.name || 'Zonder categorie'}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: item.category?.color || '#94a3b8' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen uitgaven deze maand</p>
            )}
          </CardContent>
        </Card>

        {/* Budget status */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Budget status</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.budgetStatus && data.budgetStatus.length > 0 ? (
              <div className="space-y-4">
                {data.budgetStatus.map(b => (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{b.category.icon} {b.category.name}</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${b.percentage > 100 ? 'bg-red-500' : b.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                    {b.percentage > 100 && (
                      <p className="text-xs text-red-500 mt-1 font-medium">{formatCurrency(b.spent - b.amount)} over budget</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen budgetten ingesteld voor deze maand</p>
            )}
          </CardContent>
        </Card>

        {/* Trend */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Trend (6 maanden)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.trend && (
              <div className="space-y-3">
                {data.trend.map((t, i) => {
                  const max = Math.max(...data.trend.map(x => Math.max(x.income, x.expenses)), 1)
                  return (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-muted-foreground font-medium">{getMonthName(t.month)} {t.year}</span>
                        <span className={`font-semibold tabular-nums ${t.income - t.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(t.income - t.expenses)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-2.5">
                        <div className="bg-emerald-500 rounded-full" style={{ width: `${(t.income / max) * 50}%` }} />
                        <div className="bg-red-400 rounded-full" style={{ width: `${(t.expenses / max) * 50}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Inkomsten</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block" /> Uitgaven</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Recente transacties</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-1">
                {data.recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(t.date).toLocaleDateString('nl-NL')}
                        {t.category && ` · ${t.category.icon || ''} ${t.category.name}`}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ml-3 ${t.type === 'income' ? 'text-emerald-600' : t.type === 'transfer' ? 'text-amber-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen transacties deze maand</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
