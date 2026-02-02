'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sparkles, Brain, Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, PiggyBank, Target, Award } from 'lucide-react'
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

interface AnalysisSection {
  title: string
  content: string
  type: 'summary' | 'strengths' | 'warnings' | 'tips' | 'budget' | 'goals' | 'other'
}

function parseAnalysisSections(text: string): { score: string | null; sections: AnalysisSection[] } {
  // Extract financial score (e.g. "8,5/10" or "8.5/10")
  const scoreMatch = text.match(/(?:score|Score)[:\s]*(\d[,.]?\d?\/10)/i)
  const score = scoreMatch ? scoreMatch[1] : null

  // Split on markdown headings (## or numbered headings like "1. **Title**" or "1. Title")
  const sectionRegex = /^(?:#{1,3}\s+|(?:\d+)\.\s+)(.+)$/gm
  const headings: { title: string; index: number }[] = []
  let match
  while ((match = sectionRegex.exec(text)) !== null) {
    headings.push({ title: match[1].replace(/[*#]/g, '').replace(/^\s*\S+\s*/, (s) => s.trim()), index: match.index })
  }

  if (headings.length === 0) {
    return { score, sections: [{ title: 'Analyse', content: text, type: 'other' }] }
  }

  const sections: AnalysisSection[] = headings.map((h, i) => {
    const start = text.indexOf('\n', h.index) + 1
    const end = i < headings.length - 1 ? headings[i + 1].index : text.length
    const content = text.slice(start, end).trim()
    const titleLower = h.title.toLowerCase()

    let type: AnalysisSection['type'] = 'other'
    if (titleLower.includes('samenvatting') || titleLower.includes('overzicht') || titleLower.includes('gezondheid')) type = 'summary'
    else if (titleLower.includes('sterk') || titleLower.includes('positie') || titleLower.includes('goed')) type = 'strengths'
    else if (titleLower.includes('aandacht') || titleLower.includes('zwak') || titleLower.includes('verbeter') || titleLower.includes('risico')) type = 'warnings'
    else if (titleLower.includes('bespaar') || titleLower.includes('tip')) type = 'tips'
    else if (titleLower.includes('budget')) type = 'budget'
    else if (titleLower.includes('doel') || titleLower.includes('goal') || titleLower.includes('actie')) type = 'goals'

    return { title: h.title.trim(), content, type }
  })

  return { score, sections }
}

function formatSectionContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+.+$/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/^[•●]\s*(.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1.5">${m}</ul>`)
    .replace(/\n\n+/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
    .replace(/<p class="mb-2"><\/p>/g, '')
    .replace(/^\s*<br\/>\s*/g, '')
    .trim()
}

const sectionConfig: Record<AnalysisSection['type'], { icon: React.ElementType; gradient: string; border: string; bg: string }> = {
  summary: { icon: Award, gradient: 'from-blue-500 to-indigo-600', border: 'border-blue-200 dark:border-blue-800/50', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
  strengths: { icon: TrendingUp, gradient: 'from-blue-500 to-blue-700', border: 'border-blue-200 dark:border-blue-800/50', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
  warnings: { icon: AlertTriangle, gradient: 'from-orange-500 to-amber-600', border: 'border-orange-200 dark:border-orange-800/50', bg: 'bg-orange-50/50 dark:bg-orange-950/20' },
  tips: { icon: Lightbulb, gradient: 'from-violet-500 to-purple-600', border: 'border-violet-200 dark:border-violet-800/50', bg: 'bg-violet-50/50 dark:bg-violet-950/20' },
  budget: { icon: PiggyBank, gradient: 'from-cyan-500 to-blue-600', border: 'border-cyan-200 dark:border-cyan-800/50', bg: 'bg-cyan-50/50 dark:bg-cyan-950/20' },
  goals: { icon: Target, gradient: 'from-rose-500 to-pink-600', border: 'border-rose-200 dark:border-rose-800/50', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
  other: { icon: Sparkles, gradient: 'from-gray-500 to-slate-600', border: 'border-border/50', bg: 'bg-muted/30' },
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
  const transfers = transactions.filter(t => t.type === 'transfer')
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const totalTransfers = transfers.reduce((s, t) => s + t.amount, 0)
  const savings = totalIncome - totalExpenses - totalTransfers
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
    { label: 'Inkomsten', value: formatCurrency(totalIncome), gradient: 'from-blue-500 to-blue-700', textColor: 'text-blue-600' },
    { label: 'Uitgaven', value: formatCurrency(totalExpenses), gradient: 'from-red-500 to-rose-600', textColor: 'text-red-600' },
    { label: 'Overboekingen', value: formatCurrency(totalTransfers), gradient: 'from-orange-500 to-amber-600', textColor: 'text-orange-600' },
    { label: 'Gespaard', value: formatCurrency(savings), gradient: savings >= 0 ? 'from-blue-500 to-blue-700' : 'from-red-500 to-rose-600', textColor: savings >= 0 ? 'text-blue-600' : 'text-red-600' },
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

      {aiAnalysis && (() => {
        const { score, sections } = parseAnalysisSections(aiAnalysis)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">AI Financiele Analyse</h2>
                  <p className="text-xs text-muted-foreground">{getMonthName(month)} {year}</p>
                </div>
              </div>
              {score && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">Score</span>
                  <span className="text-xl font-bold text-orange-600 dark:text-amber-400">{score}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sections.map((section, i) => {
                const config = sectionConfig[section.type]
                const Icon = config.icon
                const isFullWidth = section.type === 'summary'
                return (
                  <Card key={i} className={`${config.border} ${config.bg} overflow-hidden ${isFullWidth ? 'md:col-span-2' : ''}`}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        {section.title.replace(/^[\s🎯💪⚠️💡🏦📊✅❌]+/, '').trim()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div
                        className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:text-sm"
                        dangerouslySetInnerHTML={{ __html: formatSectionContent(section.content) }}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })()}

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Snelle Analyse</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 leading-relaxed">
          {totalExpenses === 0 && totalIncome === 0 ? (
            <p className="text-muted-foreground">Geen transacties gevonden voor deze maand.</p>
          ) : (
            <>
              {savingsRate >= 20 && <p className="text-blue-700 dark:text-blue-400">Je bespaart {savingsRate.toFixed(0)}% van je inkomen. Dat is uitstekend!</p>}
              {savingsRate >= 0 && savingsRate < 20 && <p className="text-orange-700 dark:text-orange-400">Je bespaart {savingsRate.toFixed(0)}% van je inkomen. Probeer richting 20% of meer te streven.</p>}
              {savingsRate < 0 && <p className="text-red-700 dark:text-red-400">Je geeft meer uit dan je verdient deze maand. Bekijk je grootste uitgavencategorieen hieronder.</p>}
              <p className="text-muted-foreground">Gemiddeld geef je <strong className="text-foreground">{formatCurrency(avgDailySpending)}</strong> per dag uit.</p>
              {categorySummaries.length > 0 && (
                <p className="text-muted-foreground">
                  Je grootste uitgavencategorie is <strong className="text-foreground">{categorySummaries[0].icon} {categorySummaries[0].name}</strong> met {formatCurrency(categorySummaries[0].total)} ({categorySummaries[0].percentage.toFixed(0)}% van totaal).
                </p>
              )}
              {expenses.filter(t => !t.category).length > 0 && (
                <p className="text-orange-700 dark:text-orange-400">
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
