'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Trash2, UserPlus, Eye } from 'lucide-react'

interface CollaboratorUser {
  id: string
  email: string
  name: string | null
}

interface CollaboratorEntry {
  id: string
  collaborator: CollaboratorUser
  createdAt: string
}

interface SharedWithMeEntry {
  id: string
  owner: CollaboratorUser
  createdAt: string
}

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMeEntry[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch('/api/collaborators')
      if (res.ok) {
        const data = await res.json()
        if (data.collaborators) setCollaborators(data.collaborators)
        if (data.sharedWithMe) setSharedWithMe(data.sharedWithMe)
      }
    } catch { /* network error */ }
  }, [])

  useEffect(() => {
    fetchCollaborators()
  }, [fetchCollaborators])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      if (data.newUserCreated) {
        setSuccess(`Er is een nieuw account aangemaakt voor ${email}. Deze persoon kan inloggen via "Wachtwoord vergeten" om een eigen wachtwoord in te stellen, en heeft nu toegang tot je administratie.`)
      } else {
        setSuccess(`${email} heeft nu toegang tot je administratie`)
      }
      setEmail('')
      setPassword('')
      fetchCollaborators()
    } catch {
      setError('Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(collaboratorId: string) {
    const res = await fetch('/api/collaborators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaboratorId }),
    })

    if (res.ok) {
      fetchCollaborators()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Samenwerken</h1>
        <p className="text-muted-foreground">Deel je administratie met anderen</p>
      </div>

      {/* Add collaborator form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Collaborator toevoegen
          </CardTitle>
          <CardDescription>
            Voeg iemand toe door hun emailadres in te voeren. Bevestig met je eigen wachtwoord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Emailadres van collaborator</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@voorbeeld.nl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Jouw wachtwoord (bevestiging)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Je eigen wachtwoord"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950 px-3 py-2 rounded-lg">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Toevoegen...' : 'Collaborator toevoegen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current collaborators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mijn collaborators
          </CardTitle>
          <CardDescription>
            Deze personen kunnen je transacties, categorieen, budgetten en bonnetjes inzien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Je hebt nog geen collaborators toegevoegd.
            </p>
          ) : (
            <div className="space-y-3">
              {collaborators.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {c.collaborator.name || c.collaborator.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.collaborator.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(c.collaborator.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared with me */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Gedeeld met mij
          </CardTitle>
          <CardDescription>
            Administraties waar je toegang toe hebt van anderen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharedWithMe.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Niemand heeft hun administratie met je gedeeld.
            </p>
          ) : (
            <div className="space-y-3">
              {sharedWithMe.map(s => (
                <div
                  key={s.id}
                  className="flex items-center p-3 rounded-xl border bg-card"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {s.owner.name || s.owner.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.owner.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
