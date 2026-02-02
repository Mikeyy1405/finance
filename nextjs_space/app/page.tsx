'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PiggyBank, Heart, Target, Users, ArrowRight, Sparkles } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'reset'>('login')

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

  const features = [
    { icon: PiggyBank, label: 'Financien', color: 'text-blue-400' },
    { icon: Heart, label: 'Gezondheid', color: 'text-rose-400' },
    { icon: Users, label: 'Gezin & Huis', color: 'text-amber-400' },
    { icon: Target, label: 'Doelen', color: 'text-emerald-400' },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] bg-indigo-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Livio</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Jouw leven,<br />
            <span className="text-white/80">slim georganiseerd.</span>
          </h2>
          <p className="text-lg text-white/60 max-w-md leading-relaxed">
            Alles wat belangrijk is op een plek. Van je financien tot je gezondheid, van gezinstaken tot persoonlijke doelen.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm pt-4">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <Icon className="h-4 w-4 text-white/80" />
                  <span className="text-sm font-medium text-white/90">{f.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/40">Veilig, privaat & helemaal van jou.</p>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/10 p-6 sm:p-8">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Livio</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {activeTab === 'login' && 'Welkom terug'}
              {activeTab === 'register' && 'Account aanmaken'}
              {activeTab === 'reset' && 'Wachtwoord resetten'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeTab === 'login' && 'Log in om verder te gaan met Livio'}
              {activeTab === 'register' && 'Maak een gratis account aan om te beginnen'}
              {activeTab === 'reset' && 'Vul je gegevens in om je wachtwoord te resetten'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200/50 dark:border-red-900/50">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
              {success}
            </div>
          )}

          {/* Forms */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm font-medium text-foreground">E-mailadres</Label>
                <Input id="login-email" name="email" type="email" required placeholder="naam@voorbeeld.nl" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-sm font-medium text-foreground">Wachtwoord</Label>
                <Input id="login-password" name="password" type="password" required placeholder="Voer je wachtwoord in" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-[15px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all duration-200" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Inloggen...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Inloggen
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <div className="flex items-center justify-between text-sm pt-1">
                <button type="button" className="text-muted-foreground hover:text-violet-600 transition-colors font-medium" onClick={() => { setActiveTab('reset'); setError('') }}>
                  Wachtwoord vergeten?
                </button>
                <button type="button" className="text-violet-600 hover:text-violet-700 transition-colors font-semibold" onClick={() => { setActiveTab('register'); setError('') }}>
                  Registreren
                </button>
              </div>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-sm font-medium text-foreground">Naam</Label>
                <Input id="reg-name" name="name" placeholder="Je volledige naam" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-sm font-medium text-foreground">E-mailadres</Label>
                <Input id="reg-email" name="email" type="email" required placeholder="naam@voorbeeld.nl" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm font-medium text-foreground">Wachtwoord</Label>
                <Input id="reg-password" name="password" type="password" required minLength={6} placeholder="Minimaal 6 tekens" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-sm font-medium text-foreground">Bevestig wachtwoord</Label>
                <Input id="reg-confirm" name="confirmPassword" type="password" required placeholder="Herhaal je wachtwoord" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-[15px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all duration-200" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Account aanmaken...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Account aanmaken
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground pt-1">
                Heb je al een account?{' '}
                <button type="button" className="text-violet-600 hover:text-violet-700 transition-colors font-semibold" onClick={() => { setActiveTab('login'); setError('') }}>
                  Inloggen
                </button>
              </p>
            </form>
          )}

          {activeTab === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">E-mailadres</Label>
                <Input id="reset-email" name="email" type="email" required placeholder="naam@voorbeeld.nl" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-password" className="text-sm font-medium text-foreground">Nieuw wachtwoord</Label>
                <Input id="reset-password" name="password" type="password" required minLength={6} placeholder="Minimaal 6 tekens" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm" className="text-sm font-medium text-foreground">Bevestig wachtwoord</Label>
                <Input id="reset-confirm" name="confirmPassword" type="password" required placeholder="Herhaal je wachtwoord" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-border/60 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-[15px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all duration-200" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetten...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Wachtwoord resetten
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground pt-1">
                Weet je je wachtwoord weer?{' '}
                <button type="button" className="text-violet-600 hover:text-violet-700 transition-colors font-semibold" onClick={() => { setActiveTab('login'); setError('') }}>
                  Inloggen
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
