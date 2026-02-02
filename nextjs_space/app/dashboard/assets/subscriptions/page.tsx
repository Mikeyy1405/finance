'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, Plus, Trash2, Edit, ToggleLeft, ToggleRight, CalendarClock } from 'lucide-react'

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: string
  category: string
  startDate: string
  active: boolean
}

const frequencies = [
  { value: 'wekelijks', label: 'Wekelijks', monthlyMultiplier: 4.33 },
  { value: 'maandelijks', label: 'Maandelijks', monthlyMultiplier: 1 },
  { value: 'jaarlijks', label: 'Jaarlijks', monthlyMultiplier: 1 / 12 },
]

const categories = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'software', label: 'Software' },
  { value: 'sport', label: 'Sport' },
  { value: 'verzekering', label: 'Verzekering' },
  { value: 'overig', label: 'Overig' },
]

const categoryColors: Record<string, string> = {
  streaming: 'bg-purple-100 text-purple-700',
  software: 'bg-blue-100 text-blue-700',
  sport: 'bg-green-100 text-green-700',
  verzekering: 'bg-amber-100 text-amber-700',
  overig: 'bg-gray-100 text-gray-700',
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  const [form, setForm] = useState({
    name: '',
    amount: 0,
    frequency: 'maandelijks',
    category: 'overig',
    startDate: new Date().toISOString().split('T')[0],
    active: true,
  })

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/assets/subscriptions')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setSubscriptions(data)
      }
    } catch (error) {
      console.error('Fout bij ophalen abonnementen:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingSub ? 'PUT' : 'POST'
    const url = editingSub
      ? `/api/assets/subscriptions/${editingSub.id}`
      : '/api/assets/subscriptions'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await fetchSubscriptions()
        resetForm()
      }
    } catch (error) {
      console.error('Fout bij opslaan abonnement:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit abonnement wilt verwijderen?')) return
    try {
      const res = await fetch(`/api/assets/subscriptions/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchSubscriptions()
    } catch (error) {
      console.error('Fout bij verwijderen abonnement:', error)
    }
  }

  const handleToggleActive = async (sub: Subscription) => {
    try {
      const res = await fetch(`/api/assets/subscriptions/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub, active: !sub.active }),
      })
      if (res.ok) await fetchSubscriptions()
    } catch (error) {
      console.error('Fout bij wijzigen status:', error)
    }
  }

  const resetForm = () => {
    setForm({ name: '', amount: 0, frequency: 'maandelijks', category: 'overig', startDate: new Date().toISOString().split('T')[0], active: true })
    setShowForm(false)
    setEditingSub(null)
  }

  const startEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setForm({
      name: sub.name,
      amount: sub.amount,
      frequency: sub.frequency,
      category: sub.category,
      startDate: sub.startDate.split('T')[0],
      active: sub.active,
    })
    setShowForm(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getFrequencyLabel = (value: string) => {
    return frequencies.find((f) => f.value === value)?.label ?? value
  }

  const getCategoryLabel = (value: string) => {
    return categories.find((c) => c.value === value)?.label ?? value
  }

  const calculateMonthlyTotal = () => {
    return subscriptions
      .filter((s) => s.active)
      .reduce((total, sub) => {
        const freq = frequencies.find((f) => f.value === sub.frequency)
        return total + sub.amount * (freq?.monthlyMultiplier ?? 1)
      }, 0)
  }

  const getNextPaymentDate = (sub: Subscription) => {
    const start = new Date(sub.startDate)
    const now = new Date()
    const next = new Date(start)

    if (sub.frequency === 'wekelijks') {
      while (next <= now) next.setDate(next.getDate() + 7)
    } else if (sub.frequency === 'maandelijks') {
      while (next <= now) next.setMonth(next.getMonth() + 1)
    } else if (sub.frequency === 'jaarlijks') {
      while (next <= now) next.setFullYear(next.getFullYear() + 1)
    }

    return next.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  const monthlyTotal = calculateMonthlyTotal()
  const activeCount = subscriptions.filter((s) => s.active).length
  const inactiveCount = subscriptions.filter((s) => !s.active).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CreditCard className="h-8 w-8" />
              Abonnementen
            </h1>
            <p className="mt-2 text-emerald-100">
              Beheer al je abonnementen en vaste lasten
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Abonnement toevoegen
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-lg border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Totale maandelijkse kosten</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(monthlyTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(monthlyTotal * 12)} per jaar</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-lg border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Actieve abonnementen</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-lg border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Gepauzeerde abonnementen</p>
            <p className="text-3xl font-bold text-gray-400 mt-1">{inactiveCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="rounded-xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">
              {editingSub ? 'Abonnement bewerken' : 'Nieuw abonnement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Naam</label>
                <Input
                  placeholder="Bijv. Netflix"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bedrag</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frequentie</label>
                <Select
                  value={form.frequency}
                  onValueChange={(val) => setForm({ ...form, frequency: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer frequentie" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Categorie</label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Startdatum</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setForm({ ...form, active: !form.active })}
                >
                  {form.active ? (
                    <ToggleRight className="mr-2 h-4 w-4 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="mr-2 h-4 w-4 text-gray-400" />
                  )}
                  {form.active ? 'Actief' : 'Inactief'}
                </Button>
              </div>
              <div className="col-span-full flex gap-3 pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingSub ? 'Opslaan' : 'Toevoegen'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <Card className="rounded-xl shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <CreditCard className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen abonnementen gevonden</p>
            <p className="text-sm">Voeg je eerste abonnement toe om te beginnen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card
              key={sub.id}
              className={`rounded-xl shadow-sm border-0 transition-all hover:shadow-md ${
                !sub.active ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        sub.active
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{sub.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            categoryColors[sub.category] ?? categoryColors.overig
                          }`}
                        >
                          {getCategoryLabel(sub.category)}
                        </span>
                        {!sub.active && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            Gepauzeerd
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{getFrequencyLabel(sub.frequency)}</span>
                        <span>&middot;</span>
                        <span>Gestart: {formatDate(sub.startDate)}</span>
                        {sub.active && (
                          <>
                            <span>&middot;</span>
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <CalendarClock className="h-3 w-3" />
                              Volgende: {getNextPaymentDate(sub)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(sub.amount)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleActive(sub)}
                      className={sub.active ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}
                    >
                      {sub.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(sub)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(sub.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
