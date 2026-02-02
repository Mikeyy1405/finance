'use client'

import { useEffect, useState } from 'react'
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
import {
  ShoppingCart,
  Plus,
  Check,
  Circle,
  Trash2,
  Apple,
  Carrot,
  Milk,
  Beef,
  Croissant,
  Wine,
  Package,
} from 'lucide-react'

interface GroceryItem {
  id: string
  name: string
  quantity: string
  category: string
  checked: boolean
}

const categories = [
  { value: 'groente', label: 'Groente', icon: Carrot, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'fruit', label: 'Fruit', icon: Apple, color: 'text-red-500', bg: 'bg-red-50' },
  { value: 'zuivel', label: 'Zuivel', icon: Milk, color: 'text-blue-500', bg: 'bg-blue-50' },
  { value: 'vlees', label: 'Vlees', icon: Beef, color: 'text-rose-600', bg: 'bg-rose-50' },
  { value: 'brood', label: 'Brood', icon: Croissant, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'dranken', label: 'Dranken', icon: Wine, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'overig', label: 'Overig', icon: Package, color: 'text-gray-600', bg: 'bg-gray-50' },
]

const categoryConfig: Record<string, (typeof categories)[0]> = Object.fromEntries(
  categories.map((c) => [c.value, c])
)

export default function GroceriesPage() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('overig')
  const [submitting, setSubmitting] = useState(false)

  async function fetchItems() {
    try {
      const res = await fetch('/api/family/groceries')
      if (res.ok) {
        const json = await res.json()
        setItems(json)
      }
    } catch (err) {
      console.error('Fout bij ophalen boodschappen:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  async function handleAdd() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/family/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), quantity: quantity.trim(), category }),
      })
      if (res.ok) {
        const newItem = await res.json()
        setItems((prev) => [...prev, newItem])
        setName('')
        setQuantity('')
        setCategory('overig')
      }
    } catch (err) {
      console.error('Fout bij toevoegen item:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleChecked(id: string, checked: boolean) {
    try {
      const res = await fetch(`/api/family/groceries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !checked }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !checked } : i)))
      }
    } catch (err) {
      console.error('Fout bij bijwerken item:', err)
    }
  }

  async function clearChecked() {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id)
    try {
      const res = await fetch('/api/family/groceries/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checkedIds }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => !i.checked))
      }
    } catch (err) {
      console.error('Fout bij verwijderen afgevinkte items:', err)
    }
  }

  const checkedCount = items.filter((i) => i.checked).length
  const uncheckedCount = items.filter((i) => !i.checked).length

  // Group items by category
  const grouped: Record<string, GroceryItem[]> = {}
  for (const item of items) {
    const cat = item.category || 'overig'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
            Boodschappenlijst
          </h1>
          <p className="text-muted-foreground mt-1">
            Beheer je boodschappen en vink af wat je hebt.
          </p>
        </div>
        {checkedCount > 0 && (
          <Button
            onClick={clearChecked}
            variant="outline"
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Afgevinkt verwijderen ({checkedCount})
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Circle className="h-4 w-4 text-orange-500" />
          <span>{uncheckedCount} te kopen</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{checkedCount} afgevinkt</span>
        </div>
      </div>

      {/* Add Form */}
      <Card className="rounded-xl shadow-md border-0 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="text-lg">Item Toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Productnaam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Input
              placeholder="Aantal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-lg w-full sm:w-28"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-lg w-full sm:w-40">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAdd}
              disabled={submitting || !name.trim()}
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              {submitting ? 'Toevoegen...' : 'Toevoegen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grocery List by Category */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Je boodschappenlijst is leeg.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories
            .filter((c) => grouped[c.value]?.length)
            .map((cat) => {
              const Icon = cat.icon
              return (
                <div key={cat.value} className="space-y-2">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </h3>
                  <div className="space-y-1.5">
                    {grouped[cat.value].map((item) => (
                      <Card
                        key={item.id}
                        className={`rounded-xl shadow-sm transition-all cursor-pointer ${item.checked ? 'opacity-50' : ''}`}
                        onClick={() => toggleChecked(item.id, item.checked)}
                      >
                        <CardContent className="flex items-center justify-between py-3 px-5">
                          <div className="flex items-center gap-3">
                            {item.checked ? (
                              <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                            <span className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                              {item.name}
                            </span>
                          </div>
                          {item.quantity && (
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {item.quantity}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
