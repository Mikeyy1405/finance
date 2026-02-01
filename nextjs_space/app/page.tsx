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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">FinanceTracker</CardTitle>
          <CardDescription>Beheer je persoonlijke financien</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-lg">{success}</div>
          )}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(''); setSuccess('') }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Inloggen</TabsTrigger>
              <TabsTrigger value="register">Registreren</TabsTrigger>
              <TabsTrigger value="reset">Wachtwoord reset</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input id="login-email" name="email" type="email" required placeholder="je@email.nl" />
                </div>
                <div>
                  <Label htmlFor="login-password">Wachtwoord</Label>
                  <Input id="login-password" name="password" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Bezig...' : 'Inloggen'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Wachtwoord vergeten?{' '}
                  <button type="button" className="underline text-primary" onClick={() => { setActiveTab('reset'); setError('') }}>
                    Reset je wachtwoord
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="reg-name">Naam</Label>
                  <Input id="reg-name" name="name" placeholder="Je naam" />
                </div>
                <div>
                  <Label htmlFor="reg-email">E-mail</Label>
                  <Input id="reg-email" name="email" type="email" required placeholder="je@email.nl" />
                </div>
                <div>
                  <Label htmlFor="reg-password">Wachtwoord</Label>
                  <Input id="reg-password" name="password" type="password" required minLength={6} placeholder="Min. 6 tekens" />
                </div>
                <div>
                  <Label htmlFor="reg-confirm">Bevestig wachtwoord</Label>
                  <Input id="reg-confirm" name="confirmPassword" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Bezig...' : 'Account aanmaken'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Vul je e-mail en een nieuw wachtwoord in om je wachtwoord te resetten.</p>
                <div>
                  <Label htmlFor="reset-email">E-mail</Label>
                  <Input id="reset-email" name="email" type="email" required placeholder="je@email.nl" />
                </div>
                <div>
                  <Label htmlFor="reset-password">Nieuw wachtwoord</Label>
                  <Input id="reset-password" name="password" type="password" required minLength={6} placeholder="Min. 6 tekens" />
                </div>
                <div>
                  <Label htmlFor="reset-confirm">Bevestig wachtwoord</Label>
                  <Input id="reset-confirm" name="confirmPassword" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
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
