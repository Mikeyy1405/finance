'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string; name: string; type: string; icon: string | null; color: string | null; keywords: string | null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '', color: '#22c55e', keywords: '' })

  function load() {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }
  useEffect(() => { load() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: '', type: 'expense', icon: '', color: '#22c55e', keywords: '' })
    setDialogOpen(true)
  }

  function openEdit(c: Category) {
    setEditId(c.id)
    setForm({ name: c.name, type: c.type, icon: c.icon || '', color: c.color || '#22c55e', keywords: c.keywords || '' })
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
        <h1 className="text-2xl font-bold">Categorieen</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? 'Categorie bewerken' : 'Nieuwe categorie'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Naam</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Uitgave</SelectItem>
                      <SelectItem value="income">Inkomst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Icoon</Label>
                  <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Emoji" />
                </div>
                <div>
                  <Label>Kleur</Label>
                  <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Keywords (voor auto-categorisatie, kommagescheiden)</Label>
                <Input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="albert heijn,jumbo,lidl" />
              </div>
              <Button type="submit" className="w-full">{editId ? 'Opslaan' : 'Toevoegen'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uitgaven ({expenseCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expenseCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#94a3b8' }} />
                  <span className="text-sm font-medium">{c.icon} {c.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inkomsten ({incomeCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomeCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#94a3b8' }} />
                  <span className="text-sm font-medium">{c.icon} {c.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Over auto-categorisatie</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Wanneer je een bankafschrift uploadt, worden transacties automatisch gecategoriseerd op basis van de keywords die je per categorie hebt ingesteld.
            Voeg relevante zoektermen toe (bijv. &quot;albert heijn,jumbo&quot; voor Boodschappen) zodat transacties automatisch de juiste categorie krijgen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
