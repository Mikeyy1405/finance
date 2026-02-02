'use client'

import { useEffect, useState } from 'react'
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
import {
  CalendarDays,
  Plus,
  Repeat,
  X,
  Cake,
  Stethoscope,
  GraduationCap,
  Palmtree,
  Tag,
} from 'lucide-react'

interface FamilyEvent {
  id: string
  title: string
  date: string
  type: string
  recurring: boolean
}

const eventTypes = [
  { value: 'birthday', label: 'Verjaardag' },
  { value: 'appointment', label: 'Afspraak' },
  { value: 'school', label: 'School' },
  { value: 'holiday', label: 'Vakantie' },
  { value: 'other', label: 'Overig' },
]

const eventTypeConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Cake }> = {
  birthday: { color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-l-pink-500', icon: Cake },
  appointment: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-500', icon: Stethoscope },
  school: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-l-yellow-500', icon: GraduationCap },
  holiday: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-l-green-500', icon: Palmtree },
  other: { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-l-gray-400', icon: Tag },
}

function getMonthLabel(month: number, year: number): string {
  return new Date(year, month).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function groupByMonth(events: FamilyEvent[]): Record<string, FamilyEvent[]> {
  const groups: Record<string, FamilyEvent[]> = {}
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  for (const event of sorted) {
    const d = new Date(event.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
  }
  return groups
}

export default function FamilyCalendarPage() {
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('other')
  const [recurring, setRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function fetchEvents() {
    try {
      const res = await fetch('/api/family/events')
      if (res.ok) {
        const json = await res.json()
        setEvents(json)
      }
    } catch (err) {
      console.error('Fout bij ophalen evenementen:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  async function handleAdd() {
    if (!title.trim() || !date) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/family/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), date, type, recurring }),
      })
      if (res.ok) {
        const newEvent = await res.json()
        setEvents((prev) => [...prev, newEvent])
        setTitle('')
        setDate('')
        setType('other')
        setRecurring(false)
        setShowForm(false)
      }
    } catch (err) {
      console.error('Fout bij toevoegen evenement:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/family/events/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (err) {
      console.error('Fout bij verwijderen evenement:', err)
    }
  }

  const grouped = groupByMonth(events)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Gezinskalender
          </h1>
          <p className="text-muted-foreground mt-1">
            Plan en bekijk alle evenementen van het gezin.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Evenement toevoegen
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="rounded-xl shadow-md border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg">Nieuw Evenement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg"
              />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg"
              />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={recurring ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecurring(!recurring)}
                  className="rounded-lg"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  {recurring ? 'Herhalend' : 'Eenmalig'}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-lg">
                Annuleren
              </Button>
              <Button
                onClick={handleAdd}
                disabled={submitting || !title.trim() || !date}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg"
              >
                {submitting ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {eventTypes.map((t) => {
          const config = eventTypeConfig[t.value]
          return (
            <span
              key={t.value}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${config.bg} ${config.color}`}
            >
              <config.icon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          )
        })}
      </div>

      {/* Events grouped by month */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nog geen evenementen gepland.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([key, monthEvents]) => {
          const [year, month] = key.split('-').map(Number)
          return (
            <div key={key} className="space-y-3">
              <h2 className="text-xl font-semibold capitalize">
                {getMonthLabel(month, year)}
              </h2>
              <div className="space-y-2">
                {monthEvents.map((event) => {
                  const config = eventTypeConfig[event.type] || eventTypeConfig.other
                  const Icon = config.icon
                  return (
                    <Card
                      key={event.id}
                      className={`rounded-xl border-l-4 ${config.border} ${config.bg} shadow-sm`}
                    >
                      <CardContent className="flex items-center justify-between py-4 px-5">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEventDate(event.date)}
                              {event.recurring && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <Repeat className="h-3 w-3" /> Herhalend
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
