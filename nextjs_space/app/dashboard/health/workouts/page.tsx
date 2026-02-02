'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dumbbell, Flame, Clock, Plus, Trash2, X, ChevronDown } from 'lucide-react'
import { FamilyMemberSelector } from '@/components/family-member-selector'

interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number | null
}

interface Workout {
  id: string
  name: string
  type: string
  duration: number
  calories: number | null
  date: string
  exercises: Exercise[]
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('cardio')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [saving, setSaving] = useState(false)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkouts()
  }, [selectedMember])

  function fetchWorkouts() {
    const params = selectedMember ? `?memberId=${selectedMember}` : ''
    fetch(`/api/health/workouts${params}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWorkouts(d) })
      .catch(() => {})
  }

  function addExercise() {
    setExercises([...exercises, { name: '', sets: 3, reps: 10, weight: null }])
  }

  function updateExercise(index: number, field: keyof Exercise, value: string | number | null) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !duration) return
    setSaving(true)
    try {
      await fetch('/api/health/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          duration: parseInt(duration),
          calories: calories ? parseInt(calories) : null,
          date,
          exercises: exercises.filter(ex => ex.name),
        }),
      })
      setName('')
      setDuration('')
      setCalories('')
      setExercises([])
      fetchWorkouts()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/health/workouts?id=${id}`, { method: 'DELETE' })
    fetchWorkouts()
  }

  const typeLabels: Record<string, string> = { cardio: 'Cardio', strength: 'Kracht', flexibility: 'Flexibiliteit' }
  const typeColors: Record<string, string> = { cardio: 'text-red-500', strength: 'text-blue-500', flexibility: 'text-emerald-500' }
  const thisWeek = workouts.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    return d >= weekAgo
  })
  const totalMinutes = thisWeek.reduce((s, w) => s + w.duration, 0)
  const totalCalories = thisWeek.reduce((s, w) => s + (w.calories || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registreer en bekijk je trainingen</p>
        </div>
        <FamilyMemberSelector selectedMemberId={selectedMember} onSelectMember={setSelectedMember} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deze week</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{thisWeek.length} workouts</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0 shadow-sm">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-border/50 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300" />
          <CardContent className="p-4 md:p-5 relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Totale tijd</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{totalMinutes} min</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Calorieen</p>
                <p className="text-lg md:text-2xl font-bold tracking-tight">{totalCalories} kcal</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                <Flame className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Workout registreren</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Naam</label>
                <Input placeholder="Bijv. Ochtend hardloop" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Kracht</SelectItem>
                    <SelectItem value="flexibility">Flexibiliteit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Duur (min)</label>
                  <Input type="number" placeholder="45" value={duration} onChange={e => setDuration(e.target.value)} className="rounded-xl" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Calorieen (optioneel)</label>
                  <Input type="number" placeholder="300" value={calories} onChange={e => setCalories(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Datum</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Oefeningen</label>
                  <Button type="button" variant="outline" size="sm" onClick={addExercise} className="rounded-xl text-xs gap-1">
                    <Plus className="h-3 w-3" /> Toevoegen
                  </Button>
                </div>
                {exercises.length > 0 && (
                  <div className="space-y-3">
                    {exercises.map((ex, i) => (
                      <div key={i} className="border border-border/50 rounded-xl p-3 space-y-2 relative">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(i)} className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Input placeholder="Oefening naam" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} className="rounded-lg text-sm" />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] text-muted-foreground">Sets</label>
                            <Input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 0)} className="rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground">Reps</label>
                            <Input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', parseInt(e.target.value) || 0)} className="rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground">Gewicht (kg)</label>
                            <Input type="number" step="0.5" value={ex.weight ?? ''} onChange={e => updateExercise(i, 'weight', e.target.value ? parseFloat(e.target.value) : null)} className="rounded-lg text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                {saving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent workouts */}
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Recente workouts</CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length > 0 ? (
              <div className="space-y-1">
                {workouts.slice(0, 15).map(w => (
                  <div key={w.id}>
                    <div
                      className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => setExpandedWorkout(expandedWorkout === w.id ? null : w.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{w.name}</p>
                          <span className={`text-[11px] font-medium ${typeColors[w.type] || 'text-muted-foreground'}`}>
                            {typeLabels[w.type] || w.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(w.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                          {' · '}{w.duration} min
                          {w.calories && ` · ${w.calories} kcal`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {w.exercises.length > 0 && (
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedWorkout === w.id ? 'rotate-180' : ''}`} />
                        )}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(w.id) }} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expandedWorkout === w.id && w.exercises.length > 0 && (
                      <div className="ml-4 mr-1 mb-2 mt-1 border-l-2 border-orange-300 pl-3">
                        <div className="space-y-1">
                          {w.exercises.map((ex, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-sm">
                              <span className="text-xs">{ex.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {ex.sets}x{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Nog geen workouts geregistreerd</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
