'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Moon, Star, Clock, Trash2, Sun } from 'lucide-react'

interface SleepEntry {
  id: string
  date: string
  bedTime: string
  wakeTime: string
  quality: number
  note: string | null
  duration: number
}

export default function SleepPage() {
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [bedTime, setBedTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(3)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEntries()
  }, [])

  function fetchEntries() {
    fetch('/api/health/sleep')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setEntries(d) })
      .catch(() => {})
  }

  function calculateDuration(bed: string, wake: string): number {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let bedMins = bh * 60 + bm
    let wakeMins = wh * 60 + wm
    if (wakeMins <= bedMins) wakeMins += 24 * 60
    return wakeMins - bedMins
  }

  function formatDuration(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}u ${m}m`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/health/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, bedTime, wakeTime, quality, note: note || null }),
      })
      setNote('')
      setQuality(3)
      fetchEntries()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/health/sleep?id=${id}`, { method: 'DELETE' })
    fetchEntries()
  }

  const avgDuration = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.duration, 0) / entries.length) : 0
  const avgQuality = entries.length > 0 ? (entries.reduce((s, e) => s + e.quality, 0) / entries.length).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Slaap bijhouden</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Registreer en analyseer je slaappatroon</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Laatste nacht</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">
                  {entries[0] ? formatDuration(entries[0].duration) : '---'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Moon className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gem. slaaptijd</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{avgDuration > 0 ? formatDuration(avgDuration) : '---'}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gem. kwaliteit</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{avgQuality} / 5</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                <Star className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Slaap registreren</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Datum</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Bedtijd</label>
                  <Input type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Wektijd</label>
                  <Input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Geschatte duur</label>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                  {formatDuration(calculateDuration(bedTime, wakeTime))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kwaliteit</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuality(n)}
                      className="p-1 transition-colors"
                    >
                      <Star className={`h-7 w-7 ${n <= quality ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Notitie (optioneel)</label>
                <Input placeholder="Bijv. laat naar bed gegaan" value={note} onChange={e => setNote(e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                {saving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent entries */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Slaaplogboek</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length > 0 ? (
              <div className="space-y-1">
                {entries.slice(0, 14).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{formatDuration(entry.duration)}</p>
                        <span className="text-xs text-muted-foreground">
                          {'★'.repeat(entry.quality)}{'☆'.repeat(5 - entry.quality)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                        {' · '}<Moon className="h-3 w-3 inline" /> {entry.bedTime} - <Sun className="h-3 w-3 inline" /> {entry.wakeTime}
                        {entry.note && ` · ${entry.note}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 ml-2 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Nog geen slaapregistraties</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
