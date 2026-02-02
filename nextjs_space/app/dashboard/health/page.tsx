'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scale, Droplets, Moon, Dumbbell, Pill, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface HealthSummary {
  weight: {
    latest: number | null
    previous: number | null
    trend: 'up' | 'down' | 'stable'
    unit: string
  }
  water: {
    today: number
    target: number
  }
  sleep: {
    lastBedTime: string | null
    lastWakeTime: string | null
    lastDuration: number | null
    lastQuality: number | null
  }
  workouts: {
    recent: Array<{
      id: string
      name: string
      type: string
      duration: number
      date: string
    }>
    thisWeekCount: number
  }
  medications: {
    activeCount: number
    nextDue: string | null
  }
}

const healthCards = [
  { key: 'weight', label: 'Gewicht', icon: Scale, gradient: 'from-emerald-500 to-teal-600', href: '/dashboard/health/weight' },
  { key: 'water', label: 'Water', icon: Droplets, gradient: 'from-cyan-500 to-blue-600', href: '/dashboard/health/water' },
  { key: 'sleep', label: 'Slaap', icon: Moon, gradient: 'from-indigo-500 to-purple-600', href: '/dashboard/health/sleep' },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell, gradient: 'from-orange-500 to-red-600', href: '/dashboard/health/workouts' },
  { key: 'medications', label: 'Medicijnen', icon: Pill, gradient: 'from-pink-500 to-rose-600', href: '/dashboard/health/medications' },
] as const

export default function HealthPage() {
  const [data, setData] = useState<HealthSummary | null>(null)

  useEffect(() => {
    fetch('/api/health/summary')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  function getCardValue(key: string) {
    if (!data) return '...'
    switch (key) {
      case 'weight':
        if (!data.weight.latest) return 'Geen data'
        return `${data.weight.latest} kg`
      case 'water':
        return `${data.water.today} / ${data.water.target} glazen`
      case 'sleep':
        if (!data.sleep.lastDuration) return 'Geen data'
        const hours = Math.floor(data.sleep.lastDuration / 60)
        const mins = data.sleep.lastDuration % 60
        return `${hours}u ${mins}m`
      case 'workouts':
        return `${data.workouts.thisWeekCount} deze week`
      case 'medications':
        return `${data.medications.activeCount} actief`
      default:
        return '...'
    }
  }

  function getCardSubtext(key: string) {
    if (!data) return ''
    switch (key) {
      case 'weight':
        if (!data.weight.previous || !data.weight.latest) return ''
        const diff = data.weight.latest - data.weight.previous
        if (diff === 0) return 'Stabiel'
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`
      case 'water':
        const pct = Math.round((data.water.today / data.water.target) * 100)
        return `${pct}% van doel`
      case 'sleep':
        if (data.sleep.lastQuality) return `Kwaliteit: ${'★'.repeat(data.sleep.lastQuality)}${'☆'.repeat(5 - data.sleep.lastQuality)}`
        return ''
      case 'workouts':
        if (data.workouts.recent.length > 0) return `Laatste: ${data.workouts.recent[0].name}`
        return ''
      case 'medications':
        if (data.medications.nextDue) return `Volgende: ${data.medications.nextDue}`
        return ''
      default:
        return ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gezondheid</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Houd je gezondheid en welzijn bij</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {healthCards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.key} href={card.href}>
              <Card className="premium-shadow border-border/50 overflow-hidden relative group cursor-pointer hover:shadow-lg transition-shadow duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`} />
                <CardContent className="p-4 md:p-5 relative">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                      <p className="text-lg md:text-2xl font-bold tracking-tight truncate">
                        {getCardValue(card.key)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getCardSubtext(card.key)}
                      </p>
                    </div>
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent workouts */}
      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold tracking-tight">Recente workouts</CardTitle>
            <Link href="/dashboard/health/workouts">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Bekijk alles <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.workouts.recent && data.workouts.recent.length > 0 ? (
            <div className="space-y-1">
              {data.workouts.recent.map(w => (
                <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{w.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(w.date).toLocaleDateString('nl-NL')} · {w.type}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums ml-3 text-orange-600">
                    {w.duration} min
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Nog geen workouts geregistreerd</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
