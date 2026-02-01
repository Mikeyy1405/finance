'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Transaction {
  id: string; date: string; description: string; amount: number; type: string
  category: { id: string; name: string; icon: string | null; color: string | null } | null
}

interface CategorySummary {
  name: string; icon: string | null; color: string | null
  total: number; count: number; percentage: number
  avgPerTransaction: number
}

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const load = useCallback(() => {
    fetch(`/api/transactions?month=${month}&year=${year}`).then(r => r.json()).then(setTransactions)
  }, [month, year])

  useEffect(() => { load() }, [load])

  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

  // Category breakdown for expenses
  const expenseByCategory: Record<string, { name: string; icon: string | null; color: string | null; total: number; count: number }> = {}
  for (const t of expenses) {
    const key = t.category?.name || 'Zonder categorie'
    if (!expenseByCategory[key]) {
      expenseByCategory[key] = { name: key, icon: t.category?.icon || null, color: t.category?.color || null, total: 0, count: 0 }
    }
    expenseByCategory[key].total += t.amount
    expenseByCategory[key].count += 1
  }

  const categorySummaries: CategorySummary[] = Object.values(expenseByCategory)
    .map(c => ({
      ...c,
      percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
      avgPerTransaction: c.count > 0 ? c.total / c.count : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Income breakdown
  const incomeByCategory: Record<string, { name: string; icon: string | null; total: number; count: number }> = {}
  for (const t of income) {
    const key = t.category?.name || 'Zonder categorie'
    if (!incomeByCategory[key]) {
      incomeByCategory[key] = { name: key, icon: t.category?.icon || null, total: 0, count: 0 }
    }
    incomeByCategory[key].total += t.amount
    incomeByCategory[key].count += 1
  }
  const incomeSummaries = Object.values(incomeByCategory).sort((a, b) => b.total - a.total)

  // Top expenses
  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10)

  // Daily spending
  const dailySpending: Record<string, number> = {}
  for (const t of expenses) {
    const day = new Date(t.date).toISOString().split('T')[0]
    dailySpending[day] = (dailySpending[day] || 0) + t.amount
  }
  const daysInMonth = new Date(year, month, 0).getDate()
  const avgDailySpending = totalExpenses / daysInMonth

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maandrapportage</h1>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inkomsten</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Uitgaven</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gespaard</p>
            <p className={`text-lg font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(savings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Spaarpercentage</p>
            <p className={`text-lg font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analyse & Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {totalExpenses === 0 && totalIncome === 0 ? (
            <p className="text-muted-foreground">Geen transacties gevonden voor deze maand.</p>
          ) : (
            <>
              {savingsRate >= 20 && <p className="text-green-700">Je bespaart {savingsRate.toFixed(0)}% van je inkomen. Dat is uitstekend!</p>}
              {savingsRate >= 0 && savingsRate < 20 && <p className="text-yellow-700">Je bespaart {savingsRate.toFixed(0)}% van je inkomen. Probeer richting 20% of meer te streven.</p>}
              {savingsRate < 0 && <p className="text-red-700">Je geeft meer uit dan je verdient deze maand. Bekijk je grootste uitgavencategorieen hieronder.</p>}
              <p className="text-muted-foreground">Gemiddeld geef je {formatCurrency(avgDailySpending)} per dag uit.</p>
              {categorySummaries.length > 0 && (
                <p className="text-muted-foreground">
                  Je grootste uitgavencategorie is <strong>{categorySummaries[0].icon} {categorySummaries[0].name}</strong> met {formatCurrency(categorySummaries[0].total)} ({categorySummaries[0].percentage.toFixed(0)}% van totaal).
                </p>
              )}
              {expenses.filter(t => !t.category).length > 0 && (
                <p className="text-yellow-700">
                  {expenses.filter(t => !t.category).length} transacties zijn niet gecategoriseerd.
                  Categoriseer ze via Transacties voor een beter overzicht.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Expense breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uitgaven per categorie</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Transacties</TableHead>
                <TableHead className="text-right">Gem./transactie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorySummaries.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{c.icon} {c.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-right">{c.percentage.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{c.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.avgPerTransaction)}</TableCell>
                </TableRow>
              ))}
              {categorySummaries.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Geen uitgaven</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Income breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inkomsten per categorie</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">Transacties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeSummaries.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{c.icon} {c.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-right">{c.count}</TableCell>
                </TableRow>
              ))}
              {incomeSummaries.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Geen inkomsten</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top expenses */}
      {topExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 grootste uitgaven</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topExpenses.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{new Date(t.date).toLocaleDateString('nl-NL')}</TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell className="text-sm">{t.category ? `${t.category.icon || ''} ${t.category.name}` : '—'}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-red-600">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
