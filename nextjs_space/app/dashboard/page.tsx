'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from 'lucide-react'

interface DashboardData {
  totalIncome: number
  totalExpenses: number
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
  trend: Array<{ month: number; year: number; income: number; expenses: number }>
  budgetStatus: Array<{
    id: string
    amount: number
    spent: number
    remaining: number
    percentage: number
    category: { name: string; icon: string | null; color: string | null }
  }>
}

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Inkomsten</p>
                <p className="text-lg md:text-2xl font-bold text-green-600 truncate">{formatCurrency(data?.totalIncome || 0)}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600/20 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Uitgaven</p>
                <p className="text-lg md:text-2xl font-bold text-red-600 truncate">{formatCurrency(data?.totalExpenses || 0)}</p>
              </div>
              <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600/20 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Balans</p>
                <p className={`text-lg md:text-2xl font-bold truncate ${(data?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data?.balance || 0)}
                </p>
              </div>
              <Wallet className="h-6 w-6 md:h-8 md:w-8 text-primary/20 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Transacties</p>
                <p className="text-lg md:text-2xl font-bold">{data?.recentTransactions?.length || 0}</p>
              </div>
              <ArrowUpDown className="h-6 w-6 md:h-8 md:w-8 text-primary/20 shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uitgaven per categorie</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {data.categoryBreakdown.map((item, i) => {
                  const pct = data.totalExpenses > 0 ? (item.total / data.totalExpenses) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.category?.icon} {item.category?.name || 'Zonder categorie'}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: item.category?.color || '#94a3b8' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen uitgaven deze maand</p>
            )}
          </CardContent>
        </Card>

        {/* Budget status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget status</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.budgetStatus && data.budgetStatus.length > 0 ? (
              <div className="space-y-3">
                {data.budgetStatus.map(b => (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{b.category.icon} {b.category.name}</span>
                      <span className="font-medium">
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${b.percentage > 100 ? 'bg-red-500' : b.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                    {b.percentage > 100 && (
                      <p className="text-xs text-red-500 mt-0.5">{formatCurrency(b.spent - b.amount)} over budget</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen budgetten ingesteld voor deze maand</p>
            )}
          </CardContent>
        </Card>

        {/* Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trend (6 maanden)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.trend && (
              <div className="space-y-2">
                {data.trend.map((t, i) => {
                  const max = Math.max(...data.trend.map(x => Math.max(x.income, x.expenses)), 1)
                  return (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">{getMonthName(t.month)} {t.year}</span>
                        <span className={t.income - t.expenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(t.income - t.expenses)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div className="bg-green-500 rounded-sm" style={{ width: `${(t.income / max) * 50}%` }} />
                        <div className="bg-red-400 rounded-sm" style={{ width: `${(t.expenses / max) * 50}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Inkomsten</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Uitgaven</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recente transacties</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {data.recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('nl-NL')}
                        {t.category && ` · ${t.category.icon || ''} ${t.category.name}`}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ml-2 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen transacties deze maand</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
