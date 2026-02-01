'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string; name: string; type: string; icon: string | null; color: string | null
}
interface BudgetItem {
  id: string; amount: number; month: number; year: number; categoryId: string
  category: Category; spent: number; remaining: number
}

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ categoryId: '', amount: '' })

  const load = useCallback(() => {
    fetch(`/api/budgets?month=${month}&year=${year}`).then(r => r.json()).then(setBudgets)
  }, [month, year])

  useEffect(() => {
    load()
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [load])

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const usedCategoryIds = new Set(budgets.map(b => b.categoryId))
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.has(c.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, month, year }),
    })
    if (res.ok) {
      toast.success('Budget ingesteld')
      setDialogOpen(false)
      setForm({ categoryId: '', amount: '' })
      load()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Budget verwijderen?')) return
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
    toast.success('Budget verwijderd')
    load()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgetten</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableCategories.length === 0}><Plus className="h-4 w-4 mr-2" />Budget toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw budget voor {getMonthName(month)} {year}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Categorie</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget bedrag</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full" disabled={!form.categoryId}>Instellen</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 items-center">
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

      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Totaal budget</span>
              <span className="font-bold">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map(b => {
          const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
          return (
            <Card key={b.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{b.category.icon} {b.category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(b.spent)} van {formatCurrency(b.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${pct > 100 ? 'text-red-600' : pct > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.round(pct)}%
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {b.remaining < 0 && (
                  <p className="text-xs text-red-500 mt-1">{formatCurrency(Math.abs(b.remaining))} over budget</p>
                )}
                {b.remaining > 0 && (
                  <p className="text-xs text-green-600 mt-1">{formatCurrency(b.remaining)} resterend</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>Geen budgetten ingesteld voor {getMonthName(month)} {year}</p>
            <p className="text-sm mt-1">Klik op &quot;Budget toevoegen&quot; om te beginnen</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
