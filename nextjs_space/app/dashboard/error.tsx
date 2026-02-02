'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-border/50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Er is iets misgegaan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Er is een fout opgetreden bij het laden van deze pagina.
            </p>
          </div>
          <Button onClick={reset} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Opnieuw proberen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
