'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Landmark, RefreshCw, Trash2, Plus, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BankConnection {
  id: string
  bankName: string
  bankCountry: string
  iban: string | null
  status: string
  validUntil: string | null
  lastSynced: string | null
  createdAt: string
}

const BANKS = [
  { name: 'ING', country: 'NL' },
  { name: 'ABN AMRO', country: 'NL' },
  { name: 'Rabobank', country: 'NL' },
  { name: 'SNS', country: 'NL' },
  { name: 'ASN Bank', country: 'NL' },
  { name: 'Triodos Bank', country: 'NL' },
  { name: 'Bunq', country: 'NL' },
  { name: 'Knab', country: 'NL' },
]

export default function BankPage() {
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState('ING')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/bank/status')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setConnections(data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()

    // Check for callback params
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast.success('Bankrekening succesvol gekoppeld!')
      window.history.replaceState({}, '', '/dashboard/bank')
    }
    if (params.get('error')) {
      const errors: Record<string, string> = {
        missing_params: 'Autorisatie parameters ontbreken',
        invalid_state: 'Ongeldige sessie',
        auth_failed: 'Autorisatie bij de bank is mislukt',
      }
      toast.error(errors[params.get('error')!] || 'Er is een fout opgetreden')
      window.history.replaceState({}, '', '/dashboard/bank')
    }
  }, [load])

  async function handleConnect() {
    setConnecting(true)
    try {
      const bank = BANKS.find(b => b.name === selectedBank) || BANKS[0]
      const res = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName: bank.name, country: bank.country }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Verbinding starten mislukt')
        return
      }
      // Redirect to bank authorization
      window.location.href = data.redirectUrl
    } catch {
      toast.error('Verbinding starten mislukt')
    } finally {
      setConnecting(false)
    }
  }

  async function handleSync(connectionId: string) {
    setSyncing(connectionId)
    try {
      const res = await fetch('/api/bank/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Synchronisatie mislukt')
      } else {
        toast.success(data.message)
        load()
      }
    } catch {
      toast.error('Synchronisatie mislukt')
    } finally {
      setSyncing(null)
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm('Weet je zeker dat je deze bankverbinding wilt verwijderen?')) return
    try {
      const res = await fetch('/api/bank/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      if (res.ok) {
        toast.success('Bankverbinding verwijderd')
        load()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Verwijderen mislukt')
      }
    } catch {
      toast.error('Verwijderen mislukt')
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" />Actief</span>
      case 'expired':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />Verlopen</span>
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />In afwachting</span>
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bankkoppeling</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Koppel je bankrekening om automatisch transacties te importeren via Enable Banking (PSD2)
        </p>
      </div>

      {/* Connect new bank */}
      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nieuwe bankrekening koppelen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl">
                <SelectValue placeholder="Kies je bank" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map(bank => (
                  <SelectItem key={bank.name} value={bank.name}>{bank.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleConnect} disabled={connecting} className="rounded-xl h-10 shadow-md shadow-primary/20">
              {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Landmark className="h-4 w-4 mr-2" />}
              {connecting ? 'Verbinden...' : 'Koppel bankrekening'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Je wordt doorgestuurd naar je bank om in te loggen en toestemming te geven.
            De koppeling is 90 dagen geldig en kan op elk moment worden ingetrokken.
          </p>
        </CardContent>
      </Card>

      {/* Active connections */}
      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Gekoppelde rekeningen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nog geen bankrekeningen gekoppeld. Gebruik het formulier hierboven om te beginnen.
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map(conn => (
                <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{conn.bankName}</span>
                      {statusBadge(conn.status)}
                    </div>
                    {conn.iban && (
                      <p className="text-sm text-muted-foreground font-mono">{conn.iban}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {conn.lastSynced && (
                        <span>Laatst gesynchroniseerd: {new Date(conn.lastSynced).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {conn.validUntil && (
                        <span>Geldig tot: {new Date(conn.validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {conn.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(conn.id)}
                        disabled={syncing === conn.id}
                        className="rounded-xl"
                      >
                        {syncing === conn.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {syncing === conn.id ? 'Syncing...' : 'Synchroniseren'}
                      </Button>
                    )}
                    {conn.status === 'expired' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConnect}
                        disabled={connecting}
                        className="rounded-xl"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Opnieuw koppelen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(conn.id)}
                      className="rounded-xl hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Hoe werkt het?</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Kies je bank en klik op &quot;Koppel bankrekening&quot;</li>
            <li>Je wordt doorgestuurd naar je bank om in te loggen</li>
            <li>Na autorisatie worden je transacties automatisch beschikbaar</li>
            <li>Klik op &quot;Synchroniseren&quot; om de nieuwste transacties op te halen</li>
            <li>Transacties worden automatisch gecategoriseerd via AI</li>
          </ul>
          <p className="text-xs pt-2">
            Deze koppeling verloopt via Enable Banking en voldoet aan PSD2-wetgeving.
            Je gegevens worden veilig verwerkt en je kunt de toegang op elk moment intrekken.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
