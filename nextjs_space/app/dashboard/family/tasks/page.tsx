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
  CheckSquare,
  Plus,
  Square,
  CheckCircle2,
  Circle,
  Filter,
  Trash2,
  Clock,
  User,
} from 'lucide-react'

interface HouseholdTask {
  id: string
  title: string
  assignedTo: string
  frequency: string
  dueDate: string
  completed: boolean
}

const frequencies = [
  { value: 'daily', label: 'Dagelijks' },
  { value: 'weekly', label: 'Wekelijks' },
  { value: 'monthly', label: 'Maandelijks' },
  { value: 'once', label: 'Eenmalig' },
]

const frequencyLabels: Record<string, string> = {
  daily: 'Dagelijks',
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
  once: 'Eenmalig',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function FamilyTasksPage() {
  const [tasks, setTasks] = useState<HouseholdTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [frequency, setFrequency] = useState('once')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchTasks() {
    try {
      const res = await fetch('/api/family/tasks')
      if (res.ok) {
        const json = await res.json()
        setTasks(json)
      }
    } catch (err) {
      console.error('Fout bij ophalen taken:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function handleAdd() {
    if (!title.trim() || !dueDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/family/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          assignedTo: assignedTo.trim(),
          frequency,
          dueDate,
        }),
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks((prev) => [...prev, newTask])
        setTitle('')
        setAssignedTo('')
        setFrequency('once')
        setDueDate('')
        setShowForm(false)
      }
    } catch (err) {
      console.error('Fout bij toevoegen taak:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    try {
      const res = await fetch(`/api/family/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
        )
      }
    } catch (err) {
      console.error('Fout bij bijwerken taak:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/family/tasks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (err) {
      console.error('Fout bij verwijderen taak:', err)
    }
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const pendingCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Huishoudelijke Taken
          </h1>
          <p className="text-muted-foreground mt-1">
            Verdeel en beheer taken binnen het huishouden.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Taak toevoegen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <CheckSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Totaal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-amber-100">
              <Circle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Openstaand</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Afgerond</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="rounded-xl shadow-md border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle className="text-lg">Nieuwe Taak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Titel van de taak"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg"
              />
              <Input
                placeholder="Toegewezen aan"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="rounded-lg"
              />
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Frequentie" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-lg">
                Annuleren
              </Button>
              <Button
                onClick={handleAdd}
                disabled={submitting || !title.trim() || !dueDate}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg"
              >
                {submitting ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="rounded-lg text-xs"
            >
              {f === 'all' ? 'Alles' : f === 'pending' ? 'Openstaand' : 'Afgerond'}
            </Button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Geen taken gevonden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <Card
              key={task.id}
              className={`rounded-xl shadow-sm transition-all ${task.completed ? 'opacity-60' : ''}`}
            >
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComplete(task.id, task.completed)}
                    className="focus:outline-none"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Square className="h-6 w-6 text-muted-foreground hover:text-emerald-500 transition-colors" />
                    )}
                  </button>
                  <div>
                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {task.assignedTo && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignedTo}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                        {frequencyLabels[task.frequency] || task.frequency}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
