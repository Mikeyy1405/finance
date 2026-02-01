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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transacties</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? 'Transactie bewerken' : 'Nieuwe transactie'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Datum</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v, categoryId: '' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Uitgave</SelectItem>
                      <SelectItem value="income">Inkomst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Omschrijving</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bedrag</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <Label>Categorie</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === form.type).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notitie (optioneel)</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full">{editId ? 'Opslaan' : 'Toevoegen'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            <SelectItem value="expense">Uitgaven</SelectItem>
            <SelectItem value="income">Inkomsten</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Zoeken..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inkomsten</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Uitgaven</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{filtered.length} transacties</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{new Date(t.date).toLocaleDateString('nl-NL')}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{t.description}</div>
                    {t.notes && <div className="text-xs text-muted-foreground">{t.notes}</div>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.category ? `${t.category.icon || ''} ${t.category.name}` : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Geen transacties gevonden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
