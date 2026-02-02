'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Plus, Minus, Target, Trophy } from 'lucide-react'

interface WaterData {
  today: number
  target: number
  history: Array<{ date: string; glasses: number }>
}

export default function WaterPage() {
  const [data, setData] = useState<WaterData | null>(null)
  const [updating, setUpdating] = useState(false)

  const today = data?.today ?? 0
  const target = data?.target ?? 8
  const percentage = Math.min(Math.round((today / target) * 100), 100)

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData() {
    fetch('/api/health/water')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
  }

  async function updateGlasses(delta: number) {
    const newCount = Math.max(0, today + delta)
    setUpdating(true)
    try {
      await fetch('/api/health/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glasses: newCount }),
      })
      fetchData()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Waterinname</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Houd je dagelijkse waterinname bij</p>
      </div>

      {/* Main tracker */}
      <Card className="premium-shadow border-border/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-[0.03]" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex flex-col items-center space-y-6">
            {/* Circular progress */}
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage * 2.64} 264`}
                  className="text-cyan-500 transition-all duration-500 ease-out"
                  stroke="currentColor"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Droplets className="h-6 w-6 text-cyan-500 mb-1" />
                <span className="text-3xl font-bold tabular-nums">{today}</span>
                <span className="text-sm text-muted-foreground">van {target} glazen</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => updateGlasses(-1)}
                disabled={updating || today <= 0}
                className="h-14 w-14 rounded-2xl p-0"
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="text-center px-4">
                <p className="text-4xl font-bold tabular-nums">{percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {today >= target ? 'Doel bereikt!' : `Nog ${target - today} glazen te gaan`}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => updateGlasses(1)}
                disabled={updating}
                className="h-14 w-14 rounded-2xl p-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            {/* Quick add */}
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  onClick={() => updateGlasses(n)}
                  disabled={updating}
                  className="rounded-xl text-xs"
                >
                  +{n} {n === 1 ? 'glas' : 'glazen'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress bar visual */}
      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Vandaag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{today} glazen gedronken</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between">
              {Array.from({ length: target }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-8 rounded-md flex items-center justify-center text-xs transition-colors duration-300 ${
                    i < today ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Droplets className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.history && data.history.length > 0 ? (
            <div className="space-y-1">
              {data.history.map((day, i) => {
                const dayPct = Math.min(Math.round((day.glasses / target) * 100), 100)
                return (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </p>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5 max-w-[200px]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${dayPct >= 100 ? 'bg-emerald-500' : dayPct >= 50 ? 'bg-cyan-500' : 'bg-orange-400'}`}
                          style={{ width: `${dayPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-sm font-semibold tabular-nums">{day.glasses}/{target}</span>
                      {day.glasses >= target && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Nog geen geschiedenis beschikbaar</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
