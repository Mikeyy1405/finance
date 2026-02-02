'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pill, Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string
  active: boolean
  createdAt: string
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('dagelijks')
  const [time, setTime] = useState('08:00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMedications()
  }, [])

  function fetchMedications() {
    fetch('/api/health/medications')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMedications(d) })
      .catch(() => {})
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !dosage) return
    setSaving(true)
    try {
      await fetch('/api/health/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dosage, frequency, time }),
      })
      setName('')
      setDosage('')
      setFrequency('dagelijks')
      setTime('08:00')
      fetchMedications()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch('/api/health/medications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    fetchMedications()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/health/medications?id=${id}`, { method: 'DELETE' })
    fetchMedications()
  }

  const activeMeds = medications.filter(m => m.active)
  const inactiveMeds = medications.filter(m => !m.active)

  const frequencyLabels: Record<string, string> = {
    dagelijks: 'Dagelijks',
    tweemaal: '2x per dag',
    driemaal: '3x per dag',
    wekelijks: 'Wekelijks',
    maandelijks: 'Maandelijks',
    indien_nodig: 'Indien nodig',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medicijnen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Beheer je medicijnen en supplementen</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actief</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{activeMeds.length} medicijnen</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                <Pill className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inactief</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{inactiveMeds.length} medicijnen</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Medicijn toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Naam</label>
                <Input placeholder="Bijv. Paracetamol" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Dosering</label>
                <Input placeholder="Bijv. 500mg" value={dosage} onChange={e => setDosage(e.target.value)} className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Frequentie</label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dagelijks">Dagelijks</SelectItem>
                    <SelectItem value="tweemaal">2x per dag</SelectItem>
                    <SelectItem value="driemaal">3x per dag</SelectItem>
                    <SelectItem value="wekelijks">Wekelijks</SelectItem>
                    <SelectItem value="maandelijks">Maandelijks</SelectItem>
                    <SelectItem value="indien_nodig">Indien nodig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tijdstip</label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700">
                {saving ? 'Opslaan...' : 'Toevoegen'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Medications list */}
        <div className="space-y-4">
          {/* Active */}
          <Card className="premium-shadow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Actieve medicijnen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMeds.length > 0 ? (
                <div className="space-y-1">
                  {activeMeds.map(med => (
                    <div key={med.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{med.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {med.dosage} · {frequencyLabels[med.frequency] || med.frequency}
                          {' · '}<Clock className="h-3 w-3 inline" /> {med.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(med.id, med.active)}
                          className="h-7 rounded-lg text-[11px] px-2"
                        >
                          Pauzeren
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(med.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Geen actieve medicijnen</p>
              )}
            </CardContent>
          </Card>

          {/* Inactive */}
          {inactiveMeds.length > 0 && (
            <Card className="premium-shadow border-border/50 opacity-75">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" /> Gepauzeerde medicijnen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {inactiveMeds.map(med => (
                    <div key={med.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">{med.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {med.dosage} · {frequencyLabels[med.frequency] || med.frequency}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(med.id, med.active)}
                          className="h-7 rounded-lg text-[11px] px-2"
                        >
                          Hervatten
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(med.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
