'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const form = new FormData(e.currentTarget)
    if (form.get('password') !== form.get('confirmPassword')) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
        name: form.get('name'),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.error?.includes('bestaat al')) {
        setError('Er bestaat al een account met dit e-mailadres. Gebruik het inloggen tabblad of reset je wachtwoord.')
        setLoading(false)
        setActiveTab('login')
        return
      }
      setError(data.error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const form = new FormData(e.currentTarget)
    if (form.get('password') !== form.get('confirmPassword')) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }
    setSuccess('Wachtwoord is gereset! Je bent nu ingelogd.')
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-orange-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/8 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md premium-shadow-lg border-border/50 relative">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">FinanceTracker</CardTitle>
          <CardDescription className="text-sm">Beheer je persoonlijke financien</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200/50 dark:border-red-900/50">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl border border-blue-200/50 dark:border-blue-900/50">{success}</div>
          )}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(''); setSuccess('') }}>
            <TabsList className="grid w-full grid-cols-3 rounded-xl h-11">
              <TabsTrigger value="login" className="rounded-lg text-xs font-semibold">Inloggen</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-xs font-semibold">Registreren</TabsTrigger>
              <TabsTrigger value="reset" className="rounded-lg text-xs font-semibold">Ww reset</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</Label>
                  <Input id="login-email" name="email" type="email" required placeholder="je@email.nl" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wachtwoord</Label>
                  <Input id="login-password" name="password" type="password" required placeholder="••••••••" className="h-11 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20" disabled={loading}>
                  {loading ? 'Bezig...' : 'Inloggen'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Wachtwoord vergeten?{' '}
                  <button type="button" className="underline text-primary font-medium" onClick={() => { setActiveTab('reset'); setError('') }}>
                    Reset je wachtwoord
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Naam</Label>
                  <Input id="reg-name" name="name" placeholder="Je naam" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</Label>
                  <Input id="reg-email" name="email" type="email" required placeholder="je@email.nl" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wachtwoord</Label>
                  <Input id="reg-password" name="password" type="password" required minLength={6} placeholder="Min. 6 tekens" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bevestig wachtwoord</Label>
                  <Input id="reg-confirm" name="confirmPassword" type="password" required placeholder="••••••••" className="h-11 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20" disabled={loading}>
                  {loading ? 'Bezig...' : 'Account aanmaken'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground">Vul je e-mail en een nieuw wachtwoord in om je wachtwoord te resetten.</p>
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</Label>
                  <Input id="reset-email" name="email" type="email" required placeholder="je@email.nl" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nieuw wachtwoord</Label>
                  <Input id="reset-password" name="password" type="password" required minLength={6} placeholder="Min. 6 tekens" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bevestig wachtwoord</Label>
                  <Input id="reset-confirm" name="confirmPassword" type="password" required placeholder="••••••••" className="h-11 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20" disabled={loading}>
                  {loading ? 'Bezig...' : 'Wachtwoord resetten'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
