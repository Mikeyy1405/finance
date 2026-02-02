'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  CalendarDays,
  CheckSquare,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react'

interface FamilySummary {
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    type: string
  }>
  pendingTasks: Array<{
    id: string
    title: string
    assignedTo: string
    dueDate: string
  }>
  todayMeals: Array<{
    id: string
    mealType: string
    name: string
    recipe?: string
  }>
}

const quickLinks = [
  { href: '/dashboard/family/calendar', label: 'Kalender', icon: CalendarDays, gradient: 'from-blue-500 to-indigo-600' },
  { href: '/dashboard/family/tasks', label: 'Taken', icon: CheckSquare, gradient: 'from-emerald-500 to-teal-600' },
  { href: '/dashboard/family/groceries', label: 'Boodschappen', icon: ShoppingCart, gradient: 'from-orange-500 to-amber-600' },
  { href: '/dashboard/family/meals', label: 'Maaltijden', icon: UtensilsCrossed, gradient: 'from-rose-500 to-pink-600' },
]

const eventTypeColors: Record<string, string> = {
  birthday: 'bg-pink-100 text-pink-700',
  appointment: 'bg-blue-100 text-blue-700',
  school: 'bg-yellow-100 text-yellow-700',
  holiday: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
}

const mealTypeLabels: Record<string, string> = {
  ontbijt: 'Ontbijt',
  lunch: 'Lunch',
  diner: 'Diner',
  snack: 'Snack',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function FamilyOverviewPage() {
  const [data, setData] = useState<FamilySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/family/summary')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Fout bij ophalen samenvatting:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Gezin & Huishouden
        </h1>
        <p className="text-muted-foreground mt-1">
          Beheer je gezinskalender, taken, boodschappen en maaltijden op één plek.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 rounded-xl border-0 overflow-hidden">
              <div className={`bg-gradient-to-br ${link.gradient} p-6 text-white`}>
                <link.icon className="h-8 w-8 mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-lg">{link.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : !data ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Kon gegevens niet laden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                Aankomende Evenementen
              </CardTitle>
              <Link href="/dashboard/family/calendar">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Geen aankomende evenementen
                </p>
              ) : (
                data.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${eventTypeColors[event.type] || eventTypeColors.other}`}>
                      {event.type}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-500" />
                Openstaande Taken
              </CardTitle>
              <Link href="/dashboard/family/tasks">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Geen openstaande taken
                </p>
              ) : (
                data.pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.assignedTo}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Today's Meals */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-rose-500" />
                Maaltijden Vandaag
              </CardTitle>
              <Link href="/dashboard/family/meals">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.todayMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Geen maaltijden gepland voor vandaag
                </p>
              ) : (
                data.todayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{meal.name}</p>
                      {meal.recipe && (
                        <p className="text-xs text-muted-foreground">{meal.recipe}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-medium">
                      {mealTypeLabels[meal.mealType] || meal.mealType}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
