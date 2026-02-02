'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Trash2, Crown, Shield } from 'lucide-react'

interface HouseholdMember {
  id: string
  name: string | null
  email: string
  role: string
}

interface Household {
  id: string
  name: string
  members: Array<{
    id: string
    role: string
    user: { id: string; name: string | null; email: string }
  }>
}

export default function HouseholdPage() {
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [householdName, setHouseholdName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHousehold()
  }, [])

  async function fetchHousehold() {
    try {
      const res = await fetch('/api/household')
      if (res.ok) {
        const data = await res.json()
        setHousehold(data)
        if (data?.name) setHouseholdName(data.name)
      }
    } catch {
      // no household yet
    } finally {
      setLoading(false)
    }
  }

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: householdName || 'Mijn Gezin' }),
      })
      if (res.ok) {
        await fetchHousehold()
      } else {
        const data = await res.json()
        setError(data.error || 'Fout bij aanmaken')
      }
    } finally {
      setCreating(false)
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/household/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName }),
      })
      if (res.ok) {
        setNewEmail('')
        setNewName('')
        await fetchHousehold()
      } else {
        const data = await res.json()
        setError(data.error || 'Fout bij toevoegen')
      }
    } finally {
      setAdding(false)
    }
  }

  async function removeMember(userId: string) {
    try {
      const res = await fetch(`/api/household/members?userId=${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchHousehold()
      } else {
        const data = await res.json()
        setError(data.error || 'Fout bij verwijderen')
      }
    } catch {
      setError('Fout bij verwijderen')
    }
  }

  async function updateName() {
    if (!householdName || householdName === household?.name) return
    try {
      const res = await fetch('/api/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: householdName }),
      })
      if (res.ok) {
        await fetchHousehold()
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gezin beheren</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Voeg gezinsleden toe zodat iedereen kan samenwerken
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!household ? (
        <Card className="premium-shadow border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Gezin aanmaken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Maak een gezin aan om samen te werken met je gezinsleden. Iedereen kan dan
              elkaars gezondheidsgegevens bekijken en gezamenlijk de kalender, taken,
              boodschappen en maaltijden beheren.
            </p>
            <form onSubmit={createHousehold} className="flex gap-3">
              <Input
                placeholder="Naam van je gezin (bijv. Familie Jansen)"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="rounded-xl"
              />
              <Button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 whitespace-nowrap"
              >
                {creating ? 'Aanmaken...' : 'Gezin aanmaken'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Household name */}
          <Card className="premium-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                {household.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Gezinsnaam"
                />
                <Button
                  onClick={updateName}
                  variant="outline"
                  className="rounded-xl whitespace-nowrap"
                  disabled={householdName === household.name}
                >
                  Naam wijzigen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card className="premium-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Gezinsleden ({household.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {household.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        <Crown className="h-3 w-3" />
                        Beheerder
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                          <Shield className="h-3 w-3" />
                          Lid
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.user.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add member */}
          <Card className="premium-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-orange-500" />
                Gezinslid toevoegen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Voeg een gezinslid toe via e-mailadres. Als ze nog geen account hebben wordt
                er automatisch een aangemaakt (wachtwoord: welkom123).
              </p>
              <form onSubmit={addMember} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    type="email"
                    placeholder="E-mailadres"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                  <Input
                    placeholder="Naam (optioneel)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={adding}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {adding ? 'Toevoegen...' : 'Lid toevoegen'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
