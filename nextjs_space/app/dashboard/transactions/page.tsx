'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string; name: string; type: string; icon: string | null
}
interface Transaction {
  id: string; date: string; description: string; amount: number; type: string
  categoryId: string | null; category: Category | null; notes: string | null
}

export default function TransactionsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: '', description: '', amount: '', type: 'expense', categoryId: '', notes: '' })
  const [filterType, setFilterType] = useState<string>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    fetch(`/api/transactions?month=${month}&year=${year}`).then(r => r.json()).then(setTransactions)
  }, [month, year])

  useEffect(() => {
    load()
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [load])

  function openAdd() {
    setEditId(null)
    setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'expense', categoryId: '', notes: '' })
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

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Transactie verwijderd')
      load()
    }
  }

  const filtered = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Beheer al je inkomsten en uitgaven</p>
        </div>
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px] h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            <SelectItem value="expense">Uitgaven</SelectItem>
            <SelectItem value="income">Inkomsten</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Zoeken..." className="max-w-xs h-10 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inkomsten</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uitgaven</p>
            <p className="text-xl font-bold text-red-600 tabular-nums">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">{filtered.length} transacties</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
              {filtered.map(t => (
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
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Geen transacties gevonden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
