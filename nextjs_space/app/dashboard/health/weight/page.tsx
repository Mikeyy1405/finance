'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scale, TrendingUp, TrendingDown, Minus, Plus, Trash2 } from 'lucide-react'
import { FamilyMemberSelector } from '@/components/family-member-selector'

interface WeightEntry {
  id: string
  date: string
  weight: number
  note: string | null
}

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  useEffect(() => {
    fetchEntries()
  }, [selectedMember])

  function fetchEntries() {
    const params = selectedMember ? `?memberId=${selectedMember}` : ''
    fetch(`/api/health/weight${params}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setEntries(d) })
      .catch(() => {})
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight) return
    setSaving(true)
    try {
      await fetch('/api/health/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, weight: parseFloat(weight), note: note || null }),
      })
      setWeight('')
      setNote('')
      fetchEntries()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/health/weight?id=${id}`, { method: 'DELETE' })
    fetchEntries()
  }

  const latest = entries[0]?.weight ?? null
  const previous = entries[1]?.weight ?? null
  const diff = latest !== null && previous !== null ? latest - previous : null
  const maxWeight = entries.length > 0 ? Math.max(...entries.map(e => e.weight)) : 100
  const minWeight = entries.length > 0 ? Math.min(...entries.map(e => e.weight)) : 0
  const range = maxWeight - minWeight || 1

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gewicht bijhouden</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registreer en volg je gewicht</p>
        </div>
        <FamilyMemberSelector selectedMemberId={selectedMember} onSelectMember={setSelectedMember} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Huidig gewicht</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{latest !== null ? `${latest} kg` : '---'}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                <Scale className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Verschil</p>
                <p className={`text-lg md:text-2xl font-bold tracking-tight ${diff !== null ? (diff > 0 ? 'text-red-600' : diff < 0 ? 'text-emerald-600' : '') : ''}`}>
                  {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : '---'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                {diff !== null && diff > 0 ? <TrendingUp className="h-4 w-4 text-white" /> : diff !== null && diff < 0 ? <TrendingDown className="h-4 w-4 text-white" /> : <Minus className="h-4 w-4 text-white" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Metingen</p>
              <p className="text-lg md:text-2xl font-bold tracking-tight">{entries.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend visual */}
      {entries.length > 1 && (
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Gewichtstrend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {[...entries].reverse().slice(-20).map((entry, i) => {
                const heightPct = range > 0 ? ((entry.weight - minWeight) / range) * 80 + 20 : 50
                return (
                  <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{entry.weight}</span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-sm transition-all duration-300 min-h-[4px]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Gewicht registreren</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Datum</label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gewicht (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Notitie (optioneel)</label>
                <Input
                  placeholder="Bijv. na het sporten"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                {saving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent entries */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Recente metingen</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length > 0 ? (
              <div className="space-y-1">
                {entries.slice(0, 15).map((entry, i) => {
                  const prev = entries[i + 1]
                  const entryDiff = prev ? entry.weight - prev.weight : null
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{entry.weight} kg</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(entry.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                          {entry.note && ` · ${entry.note}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {entryDiff !== null && (
                          <span className={`text-xs font-semibold tabular-nums ${entryDiff > 0 ? 'text-red-500' : entryDiff < 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {entryDiff > 0 ? '+' : ''}{entryDiff.toFixed(1)}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Nog geen metingen geregistreerd</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
