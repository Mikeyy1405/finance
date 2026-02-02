'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Car, Wrench, Plus, Trash2, Edit, Calendar, Gauge } from 'lucide-react'

interface MaintenanceLog {
  id: string
  date: string
  type: string
  description: string
  cost: number
  mileage: number
  nextDueDate: string | null
}

interface Vehicle {
  id: string
  name: string
  licensePlate: string
  make: string
  model: string
  year: number
  mileage: number
  maintenanceLogs: MaintenanceLog[]
}

const maintenanceTypes = [
  { value: 'apk', label: 'APK' },
  { value: 'olie', label: 'Olie verversen' },
  { value: 'banden', label: 'Banden' },
  { value: 'service', label: 'Service' },
  { value: 'reparatie', label: 'Reparatie' },
]

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<string | null>(null)

  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
  })

  const [maintenanceForm, setMaintenanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'service',
    description: '',
    cost: 0,
    mileage: 0,
    nextDueDate: '',
  })

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/assets/vehicles')
      if (res.ok) {
        const data = await res.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Fout bij ophalen voertuigen:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingVehicle ? 'PUT' : 'POST'
    const url = editingVehicle
      ? `/api/assets/vehicles/${editingVehicle.id}`
      : '/api/assets/vehicles'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm),
      })
      if (res.ok) {
        await fetchVehicles()
        resetVehicleForm()
      }
    } catch (error) {
      console.error('Fout bij opslaan voertuig:', error)
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit voertuig wilt verwijderen?')) return
    try {
      const res = await fetch(`/api/assets/vehicles/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchVehicles()
    } catch (error) {
      console.error('Fout bij verwijderen voertuig:', error)
    }
  }

  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!maintenanceVehicleId) return

    try {
      const res = await fetch(`/api/assets/vehicles/${maintenanceVehicleId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...maintenanceForm,
          nextDueDate: maintenanceForm.nextDueDate || null,
        }),
      })
      if (res.ok) {
        await fetchVehicles()
        resetMaintenanceForm()
      }
    } catch (error) {
      console.error('Fout bij opslaan onderhoudslog:', error)
    }
  }

  const handleDeleteMaintenance = async (vehicleId: string, logId: string) => {
    try {
      const res = await fetch(`/api/assets/vehicles/${vehicleId}/maintenance/${logId}`, {
        method: 'DELETE',
      })
      if (res.ok) await fetchVehicles()
    } catch (error) {
      console.error('Fout bij verwijderen onderhoudslog:', error)
    }
  }

  const resetVehicleForm = () => {
    setVehicleForm({ name: '', licensePlate: '', make: '', model: '', year: new Date().getFullYear(), mileage: 0 })
    setShowForm(false)
    setEditingVehicle(null)
  }

  const resetMaintenanceForm = () => {
    setMaintenanceForm({ date: new Date().toISOString().split('T')[0], type: 'service', description: '', cost: 0, mileage: 0, nextDueDate: '' })
    setMaintenanceVehicleId(null)
  }

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleForm({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
    })
    setShowForm(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const getMaintenanceTypeLabel = (type: string) => {
    return maintenanceTypes.find((t) => t.value === type)?.label ?? type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Car className="h-8 w-8" />
              Voertuigen
            </h1>
            <p className="mt-2 text-blue-100">
              Beheer je voertuigen en onderhoudslogs
            </p>
          </div>
          <Button
            onClick={() => { resetVehicleForm(); setShowForm(true) }}
            className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Voertuig toevoegen
          </Button>
        </div>
      </div>

      {/* Vehicle Form */}
      {showForm && (
        <Card className="rounded-xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">
              {editingVehicle ? 'Voertuig bewerken' : 'Nieuw voertuig'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVehicle} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Naam</label>
                <Input
                  placeholder="Bijv. Mijn auto"
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kenteken</label>
                <Input
                  placeholder="AB-123-CD"
                  value={vehicleForm.licensePlate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Merk</label>
                <Input
                  placeholder="Bijv. Volkswagen"
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Model</label>
                <Input
                  placeholder="Bijv. Golf"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bouwjaar</label>
                <Input
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kilometerstand</label>
                <Input
                  type="number"
                  min={0}
                  value={vehicleForm.mileage}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="col-span-full flex gap-3 pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingVehicle ? 'Opslaan' : 'Toevoegen'}
                </Button>
                <Button type="button" variant="outline" onClick={resetVehicleForm}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vehicles List */}
      {vehicles.length === 0 ? (
        <Card className="rounded-xl shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Car className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen voertuigen gevonden</p>
            <p className="text-sm">Voeg je eerste voertuig toe om te beginnen</p>
          </CardContent>
        </Card>
      ) : (
        vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="rounded-xl shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Car className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{vehicle.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {vehicle.make} {vehicle.model} &middot; {vehicle.year} &middot;{' '}
                      <span className="font-mono font-semibold text-gray-700">{vehicle.licensePlate}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 mr-2">
                    <Gauge className="h-4 w-4" />
                    {vehicle.mileage.toLocaleString('nl-NL')} km
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditVehicle(vehicle)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Maintenance section header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Onderhoudslogs
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setMaintenanceVehicleId(
                      maintenanceVehicleId === vehicle.id ? null : vehicle.id
                    )
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Onderhoud toevoegen
                </Button>
              </div>

              {/* Maintenance Form */}
              {maintenanceVehicleId === vehicle.id && (
                <form
                  onSubmit={handleSubmitMaintenance}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Datum</label>
                    <Input
                      type="date"
                      value={maintenanceForm.date}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <Select
                      value={maintenanceForm.type}
                      onValueChange={(val) => setMaintenanceForm({ ...maintenanceForm, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Beschrijving</label>
                    <Input
                      placeholder="Bijv. Olie vervangen"
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kosten</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={maintenanceForm.cost}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kilometerstand</label>
                    <Input
                      type="number"
                      min={0}
                      value={maintenanceForm.mileage}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, mileage: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Volgende keuring</label>
                    <Input
                      type="date"
                      value={maintenanceForm.nextDueDate}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextDueDate: e.target.value })}
                    />
                  </div>
                  <div className="col-span-full flex gap-3 pt-2">
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Opslaan
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={resetMaintenanceForm}>
                      Annuleren
                    </Button>
                  </div>
                </form>
              )}

              {/* Maintenance Logs */}
              {vehicle.maintenanceLogs && vehicle.maintenanceLogs.length > 0 ? (
                <div className="space-y-2">
                  {vehicle.maintenanceLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getMaintenanceTypeLabel(log.type)} &mdash; {log.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(log.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              {log.mileage.toLocaleString('nl-NL')} km
                            </span>
                            {log.nextDueDate && (
                              <span className="text-blue-600 font-medium">
                                Volgende: {formatDate(log.nextDueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(log.cost)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteMaintenance(vehicle.id, log.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic py-2">
                  Nog geen onderhoudslogs toegevoegd
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
