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
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Coffee,
  Sandwich,
  ChefHat,
  Cookie,
} from 'lucide-react'

interface Meal {
  id: string
  date: string
  mealType: string
  name: string
  recipe?: string
}

const mealTypes = [
  { value: 'ontbijt', label: 'Ontbijt', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'lunch', label: 'Lunch', icon: Sandwich, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'diner', label: 'Diner', icon: ChefHat, color: 'text-rose-600', bg: 'bg-rose-50' },
  { value: 'snack', label: 'Snack', icon: Cookie, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Monday = 0 in our system, Sunday getDay() = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function getWeekLabel(dates: Date[]): string {
  const start = dates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
  const end = dates[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${start} - ${end}`
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formMealType, setFormMealType] = useState('diner')
  const [formName, setFormName] = useState('')
  const [formRecipe, setFormRecipe] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const weekDates = getWeekDates(weekOffset)

  async function fetchMeals() {
    const start = formatDateKey(weekDates[0])
    const end = formatDateKey(weekDates[6])
    try {
      const res = await fetch(`/api/family/meals?start=${start}&end=${end}`)
      if (res.ok) {
        const json = await res.json()
        setMeals(json)
      }
    } catch (err) {
      console.error('Fout bij ophalen maaltijden:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchMeals()
  }, [weekOffset])

  function openForm(date: Date, mealType: string) {
    setFormDate(formatDateKey(date))
    setFormMealType(mealType)
    setFormName('')
    setFormRecipe('')
    setShowForm(true)
  }

  async function handleAdd() {
    if (!formName.trim() || !formDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/family/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          mealType: formMealType,
          name: formName.trim(),
          recipe: formRecipe.trim() || undefined,
        }),
      })
      if (res.ok) {
        const newMeal = await res.json()
        setMeals((prev) => [...prev, newMeal])
        setShowForm(false)
      }
    } catch (err) {
      console.error('Fout bij toevoegen maaltijd:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/family/meals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMeals((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (err) {
      console.error('Fout bij verwijderen maaltijd:', err)
    }
  }

  // Index meals by date+type
  const mealMap: Record<string, Meal[]> = {}
  for (const meal of meals) {
    const key = `${meal.date.split('T')[0]}_${meal.mealType}`
    if (!mealMap[key]) mealMap[key] = []
    mealMap[key].push(meal)
  }

  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(new Date())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
          Maaltijdplanner
        </h1>
        <p className="text-muted-foreground mt-1">
          Plan je maaltijden voor de hele week vooruit.
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="rounded-lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Vorige week
        </Button>
        <div className="text-center">
          <p className="font-semibold text-lg">{getWeekLabel(weekDates)}</p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-rose-500 hover:underline"
            >
              Naar deze week
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="rounded-lg"
        >
          Volgende week
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Add Meal Modal */}
      {showForm && (
        <Card className="rounded-xl shadow-md border-0 bg-gradient-to-br from-rose-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Maaltijd Toevoegen</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-lg"
              />
              <Select value={formMealType} onValueChange={setFormMealType}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Maaltijdtype" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Naam van het gerecht"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="rounded-lg"
              />
              <Input
                placeholder="Recept (optioneel)"
                value={formRecipe}
                onChange={(e) => setFormRecipe(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-lg">
                Annuleren
              </Button>
              <Button
                onClick={handleAdd}
                disabled={submitting || !formName.trim()}
                className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg"
              >
                {submitting ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDates.map((date, dayIndex) => (
            <Card
              key={dayIndex}
              className={`rounded-xl shadow-sm ${isToday(date) ? 'ring-2 ring-rose-400' : ''}`}
            >
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold flex flex-col items-center">
                  <span className={isToday(date) ? 'text-rose-600' : ''}>{dayNames[dayIndex]}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {formatShortDate(date)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                {mealTypes.map((mt) => {
                  const key = `${formatDateKey(date)}_${mt.value}`
                  const dayMeals = mealMap[key] || []
                  const Icon = mt.icon
                  return (
                    <div key={mt.value}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium flex items-center gap-1 ${mt.color}`}>
                          <Icon className="h-3 w-3" />
                          {mt.label}
                        </span>
                        <button
                          onClick={() => openForm(date, mt.value)}
                          className="text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {dayMeals.length === 0 ? (
                        <p className="text-xs text-muted-foreground/50 italic pl-4">-</p>
                      ) : (
                        dayMeals.map((meal) => (
                          <div
                            key={meal.id}
                            className={`text-xs p-1.5 rounded-lg ${mt.bg} flex items-start justify-between group`}
                          >
                            <div>
                              <p className="font-medium">{meal.name}</p>
                              {meal.recipe && (
                                <p className="text-muted-foreground mt-0.5">{meal.recipe}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(meal.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
