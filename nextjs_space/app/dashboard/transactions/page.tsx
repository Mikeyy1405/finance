'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string; name: string; type: string; icon: string | null; color: string | null
}
interface Transaction {
  id: string; date: string; description: string; amount: number; type: string
  categoryId: string | null; category: Category | null; notes: string | null
}
interface BudgetItem {
  id: string; amount: number; categoryId: string; category: Category; spent: number; remaining: number
}

type TabType = 'overview' | 'income' | 'expense'

export default function TransactionsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: '', description: '', amount: '', type: 'expense', categoryId: '', notes: '' })
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [search, setSearch] = useState('')
  const [recategorizing, setRecategorizing] = useState(false)
  const [budgets, setBudgets] = useState<BudgetItem[]>([])

  const loadBudgets = useCallback(() => {
    fetch(`/api/budgets?month=${month}&year=${year}`).then(r => r.json()).then((data: BudgetItem[] | { error: string }) => {
      if (Array.isArray(data)) setBudgets(data)
    })
  }, [month, year])

  const load = useCallback(() => {
    fetch(`/api/transactions?month=${month}&year=${year}`).then(r => r.json()).then(setTransactions)
    loadBudgets()
  }, [month, year, loadBudgets])

  useEffect(() => {
    load()
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [load])

  function openAdd() {
    setEditId(null)
    setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: activeTab === 'income' ? 'income' : 'expense', categoryId: '', notes: '' })
    setDialogOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditId(t.id)
    setForm({
      date: new Date(t.date).toISOString().split('T')[0],
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      categoryId: t.categoryId || '',
      notes: t.notes || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = editId ? `/api/transactions/${editId}` : '/api/transactions'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, categoryId: form.categoryId || null }),
    })
    if (res.ok) {
      toast.success(editId ? 'Transactie bijgewerkt' : 'Transactie toegevoegd')
      setDialogOpen(false)
      load()
    }
  }

  async function handleRecategorize() {
    setRecategorizing(true)
    try {
      const res = await fetch('/api/ai/recategorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        load()
      } else {
        toast.error(data.error || 'Opnieuw categoriseren mislukt')
      }
    } catch {
      toast.error('Opnieuw categoriseren mislukt')
    } finally {
      setRecategorizing(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Transactie verwijderd')
      load()
    }
  }

  const searchFiltered = transactions.filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
  const incomeTransactions = searchFiltered.filter(t => t.type === 'income')
  const expenseTransactions = searchFiltered.filter(t => t.type === 'expense')

  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0)
  const totalExpense = expenseTransactions.reduce((s, t) => s + t.amount, 0)

  // Group expenses by category for subtotals
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null; color: string | null; total: number; count: number; isGroceries: boolean }>()
    expenseTransactions.forEach(t => {
      const key = t.categoryId || '__uncategorized'
      const existing = map.get(key)
      const catName = t.category?.name || 'Zonder categorie'
      const isGroceries = catName.toLowerCase().includes('boodschappen')
      if (existing) {
        existing.total += t.amount
        existing.count += 1
      } else {
        map.set(key, { name: catName, icon: t.category?.icon || null, color: t.category?.color || null, total: t.amount, count: 1, isGroceries })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [expenseTransactions])

  // Group income by category
  const incomeByCategory = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null; total: number; count: number }>()
    incomeTransactions.forEach(t => {
      const key = t.categoryId || '__uncategorized'
      const existing = map.get(key)
      if (existing) {
        existing.total += t.amount
        existing.count += 1
      } else {
        map.set(key, { name: t.category?.name || 'Zonder categorie', icon: t.category?.icon || null, total: t.amount, count: 1 })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [incomeTransactions])

  const groceriesTotal = expenseByCategory.filter(c => c.isGroceries).reduce((s, c) => s + c.total, 0)
  const otherExpensesTotal = totalExpense - groceriesTotal

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overzicht' },
    { key: 'expense', label: `Uitgaven (${expenseTransactions.length})` },
    { key: 'income', label: `Inkomsten (${incomeTransactions.length})` },
  ]

  function renderTransactionTable(items: Transaction[]) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Datum</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Omschrijving</TableHead>
            <TableHead className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-wider">Categorie</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider">Bedrag</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(t => (
            <TableRow key={t.id} className="border-border/50 hover:bg-muted/50 transition-colors">
              <TableCell className="text-sm tabular-nums">{new Date(t.date).toLocaleDateString('nl-NL')}</TableCell>
              <TableCell>
                <div className="text-sm font-medium">{t.description}</div>
                {t.notes && <div className="text-xs text-muted-foreground mt-0.5">{t.notes}</div>}
              </TableCell>
              <TableCell className="text-sm hidden sm:table-cell">
                {t.category ? `${t.category.icon || ''} ${t.category.name}` : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className={`text-right font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </TableCell>
              <TableCell>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Geen transacties gevonden</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Beheer al je inkomsten en uitgaven</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecategorize} disabled={recategorizing} className="rounded-xl h-10">
            <RefreshCw className={`h-4 w-4 mr-2 ${recategorizing ? 'animate-spin' : ''}`} />
            {recategorizing ? 'Bezig...' : 'Opnieuw categoriseren'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="rounded-xl h-10 shadow-md shadow-primary/20"><Plus className="h-4 w-4 mr-2" />Toevoegen</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">{editId ? 'Transactie bewerken' : 'Nieuwe transactie'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Datum</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v, categoryId: '' }))}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Uitgave</SelectItem>
                      <SelectItem value="income">Inkomst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Omschrijving</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required className="h-10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bedrag</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categorie</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === form.type).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notitie (optioneel)</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20">{editId ? 'Opslaan' : 'Toevoegen'}</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
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
        <Input placeholder="Zoeken..." className="max-w-xs h-10 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inkomsten</p>
            </div>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uitgaven</p>
            </div>
            <p className="text-xl font-bold text-red-600 tabular-nums">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-orange-600" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Boodschappen</p>
            </div>
            <p className="text-xl font-bold text-orange-600 tabular-nums">{formatCurrency(groceriesTotal)}</p>
          </CardContent>
        </Card>
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">=</span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Balans</p>
            </div>
            <p className={`text-xl font-bold tabular-nums ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense breakdown by category */}
          <Card className="premium-shadow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Uitgaven per categorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <div className="space-y-3">
                  {expenseByCategory.map((cat, i) => {
                    const pct = totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            {cat.icon} {cat.name}
                            {cat.isGroceries && <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">Boodschappen</span>}
                            <span className="text-xs text-muted-foreground">({cat.count}x)</span>
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-red-600">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: cat.color || '#ef4444' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {/* Groceries vs rest summary */}
                  <div className="pt-3 mt-3 border-t border-border/50 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Boodschappen totaal</span>
                      <span className="font-semibold tabular-nums text-orange-600">{formatCurrency(groceriesTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overige uitgaven</span>
                      <span className="font-semibold tabular-nums text-red-600">{formatCurrency(otherExpensesTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Geen uitgaven deze maand</p>
              )}
            </CardContent>
          </Card>

          {/* Income breakdown by category */}
          <Card className="premium-shadow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Inkomsten per categorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCategory.length > 0 ? (
                <div className="space-y-3">
                  {incomeByCategory.map((cat, i) => {
                    const pct = totalIncome > 0 ? (cat.total / totalIncome) * 100 : 0
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            {cat.icon} {cat.name}
                            <span className="text-xs text-muted-foreground">({cat.count}x)</span>
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-emerald-600">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Geen inkomsten deze maand</p>
              )}
            </CardContent>
          </Card>

          {/* Budget status */}
          {budgets.length > 0 && (
            <Card className="premium-shadow border-border/50 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Budget overzicht — {getMonthName(month)} {year}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {budgets.map(b => {
                    const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
                    return (
                      <div key={b.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{b.category.icon} {b.category.name}</span>
                          <span className={`text-sm font-semibold tabular-nums ${pct > 100 ? 'text-red-600' : pct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatCurrency(b.remaining >= 0 ? b.remaining : 0)} resterend
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</span>
                        </div>
                        {b.remaining < 0 && (
                          <p className="text-xs text-red-500 mt-0.5 font-medium">{formatCurrency(Math.abs(b.remaining))} over budget</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expense' && (
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                {expenseTransactions.length} uitgaven — {formatCurrency(totalExpense)}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {renderTransactionTable(expenseTransactions)}
          </CardContent>
        </Card>
      )}

      {/* INCOME TAB */}
      {activeTab === 'income' && (
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                {incomeTransactions.length} inkomsten — {formatCurrency(totalIncome)}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {renderTransactionTable(incomeTransactions)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
