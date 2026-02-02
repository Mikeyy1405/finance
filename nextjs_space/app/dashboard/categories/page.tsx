'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string; name: string; type: string; icon: string | null; color: string | null; keywords: string | null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '', color: '#2563eb', keywords: '' })

  function load() {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCategories(d) })
      .catch(() => {})
  }
  useEffect(() => { load() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: '', type: 'expense', icon: '', color: '#2563eb', keywords: '' })
    setDialogOpen(true)
  }

  function openEdit(c: Category) {
    setEditId(c.id)
    setForm({ name: c.name, type: c.type, icon: c.icon || '', color: c.color || '#2563eb', keywords: c.keywords || '' })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = editId ? `/api/categories/${editId}` : '/api/categories'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success(editId ? 'Categorie bijgewerkt' : 'Categorie toegevoegd')
      setDialogOpen(false)
      load()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Er is iets misgegaan')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je deze categorie wilt verwijderen? Transacties worden niet verwijderd.')) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Categorie verwijderd')
      load()
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorieen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organiseer je transacties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="rounded-xl h-10 shadow-md shadow-primary/20"><Plus className="h-4 w-4 mr-2" />Toevoegen</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">{editId ? 'Categorie bewerken' : 'Nieuwe categorie'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Naam</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="h-10 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Uitgave</SelectItem>
                      <SelectItem value="income">Inkomst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Icoon</Label>
                  <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Emoji" className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kleur</Label>
                  <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Keywords (auto-categorisatie, kommagescheiden)</Label>
                <Input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="albert heijn,jumbo,lidl" className="h-10 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20">{editId ? 'Opslaan' : 'Toevoegen'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Uitgaven ({expenseCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expenseCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3.5 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-background" style={{ backgroundColor: c.color || '#94a3b8', '--tw-ring-color': c.color || '#94a3b8' } as React.CSSProperties} />
                  <span className="text-sm font-medium">{c.icon} {c.name}</span>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Inkomsten ({incomeCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomeCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3.5 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-background" style={{ backgroundColor: c.color || '#94a3b8', '--tw-ring-color': c.color || '#94a3b8' } as React.CSSProperties} />
                  <span className="text-sm font-medium">{c.icon} {c.name}</span>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Over auto-categorisatie</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          <p>
            Wanneer je een bankafschrift uploadt, worden transacties automatisch gecategoriseerd op basis van de keywords die je per categorie hebt ingesteld.
            Voeg relevante zoektermen toe (bijv. &quot;albert heijn,jumbo&quot; voor Boodschappen) zodat transacties automatisch de juiste categorie krijgen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
