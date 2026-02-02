'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sparkles, Brain, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
  id: string; date: string; description: string; amount: number; type: string
  category: { id: string; name: string; icon: string | null; color: string | null } | null
}

interface CategorySummary {
  name: string; icon: string | null; color: string | null
  total: number; count: number; percentage: number
  avgPerTransaction: number
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-6 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
}

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [catLoading, setCatLoading] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/transactions?month=${month}&year=${year}`).then(r => r.json()).then(setTransactions)
    setAiAnalysis(null)
  }, [month, year])

  useEffect(() => { load() }, [load])

  async function runAiAnalysis() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        setAiAnalysis(data.analysis)
      }
    } catch {
      toast.error('AI analyse mislukt')
    } finally {
      setAiLoading(false)
    }
  }

  async function runAiCategorize() {
    setCatLoading(true)
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        toast.success(data.message)
        load()
      }
    } catch {
      toast.error('AI categorisatie mislukt')
    } finally {
      setCatLoading(false)
    }
  }

  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

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

  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10)

  const daysInMonth = new Date(year, month, 0).getDate()
  const avgDailySpending = totalExpenses / daysInMonth

  const overviewCards = [
    { label: 'Inkomsten', value: formatCurrency(totalIncome), gradient: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-600' },
    { label: 'Uitgaven', value: formatCurrency(totalExpenses), gradient: 'from-red-500 to-rose-600', textColor: 'text-red-600' },
    { label: 'Gespaard', value: formatCurrency(savings), gradient: savings >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600', textColor: savings >= 0 ? 'text-emerald-600' : 'text-red-600' },
    { label: 'Spaarpercentage', value: `${savingsRate.toFixed(1)}%`, gradient: savingsRate >= 20 ? 'from-emerald-500 to-teal-600' : savingsRate >= 0 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600', textColor: savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 0 ? 'text-amber-600' : 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maandrapportage</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inzicht in je financiele prestaties</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {overviewCards.map((card, i) => (
          <Card key={i} className="premium-shadow border-border/50 overflow-hidden relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`} />
            <CardContent className="p-4 relative">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className={`text-lg font-bold tabular-nums ${card.textColor}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={runAiAnalysis} disabled={aiLoading || transactions.length === 0} className="rounded-xl h-10 shadow-md shadow-primary/20">
          {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {aiLoading ? 'Analyseren...' : 'AI Analyse starten'}
        </Button>
        {expenses.filter(t => !t.category).length > 0 && (
          <Button onClick={runAiCategorize} disabled={catLoading} variant="outline" className="rounded-xl h-10">
            {catLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            {catLoading ? 'Categoriseren...' : `${expenses.filter(t => !t.category).length} transacties AI-categoriseren`}
          </Button>
        )}
      </div>

      {aiAnalysis && (
        <Card className="border-primary/20 bg-primary/[0.02] premium-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              AI Financiele Analyse - {getMonthName(month)} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }} />
          </CardContent>
        </Card>
      )}

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Snelle Analyse</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 leading-relaxed">
          {totalExpenses === 0 && totalIncome === 0 ? (
            <p className="text-muted-foreground">Geen transacties gevonden voor deze maand.</p>
          ) : (
            <>
              {savingsRate >= 20 && <p className="text-emerald-700 dark:text-emerald-400">Je bespaart {savingsRate.toFixed(0)}% van je inkomen. Dat is uitstekend!</p>}
              {savingsRate >= 0 && savingsRate < 20 && <p className="text-amber-700 dark:text-amber-400">Je bespaart {savingsRate.toFixed(0)}% van je inkomen. Probeer richting 20% of meer te streven.</p>}
              {savingsRate < 0 && <p className="text-red-700 dark:text-red-400">Je geeft meer uit dan je verdient deze maand. Bekijk je grootste uitgavencategorieen hieronder.</p>}
              <p className="text-muted-foreground">Gemiddeld geef je <strong className="text-foreground">{formatCurrency(avgDailySpending)}</strong> per dag uit.</p>
              {categorySummaries.length > 0 && (
                <p className="text-muted-foreground">
                  Je grootste uitgavencategorie is <strong className="text-foreground">{categorySummaries[0].icon} {categorySummaries[0].name}</strong> met {formatCurrency(categorySummaries[0].total)} ({categorySummaries[0].percentage.toFixed(0)}% van totaal).
                </p>
              )}
              {expenses.filter(t => !t.category).length > 0 && (
                <p className="text-amber-700 dark:text-amber-400">
                  {expenses.filter(t => !t.category).length} transacties zijn niet gecategoriseerd.
                  Gebruik de AI-categoriseer knop hierboven of doe het handmatig via Transacties.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Uitgaven per categorie</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Categorie</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Bedrag</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">%</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Transacties</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Gem./transactie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorySummaries.map((c, i) => (
                <TableRow key={i} className="border-border/50 hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{c.icon} {c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.percentage.toFixed(1)}%</TableCell>
                  <TableCell className="text-right tabular-nums">{c.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.avgPerTransaction)}</TableCell>
                </TableRow>
              ))}
              {categorySummaries.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Geen uitgaven</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Inkomsten per categorie</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Categorie</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Bedrag</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Transacties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeSummaries.map((c, i) => (
                <TableRow key={i} className="border-border/50 hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{c.icon} {c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.count}</TableCell>
                </TableRow>
              ))}
              {incomeSummaries.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Geen inkomsten</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {topExpenses.length > 0 && (
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Top 10 grootste uitgaven</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Datum</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Omschrijving</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Categorie</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topExpenses.map(t => (
                  <TableRow key={t.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm tabular-nums">{new Date(t.date).toLocaleDateString('nl-NL')}</TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell className="text-sm">{t.category ? `${t.category.icon || ''} ${t.category.name}` : '—'}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-red-600 tabular-nums">{formatCurrency(t.amount)}</TableCell>
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
