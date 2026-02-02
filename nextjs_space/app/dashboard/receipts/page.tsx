'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Receipt, CheckCircle2, AlertCircle, ShoppingBag, Calendar, Tag, Loader2, Image as ImageIcon, Link2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

interface MatchingTransaction {
  id: string
  date: string
  description: string
  amount: number
  category: { name: string; icon: string | null } | null
  notes: string | null
}

interface ReceiptResult {
  receiptId: string
  storeName: string
  date: string | null
  totalAmount: number
  items: ReceiptItem[]
  category: string
  categoryId: string | null
  matchingTransactions: MatchingTransaction[]
  message: string
}

interface HistoryReceipt {
  id: string
  filename: string
  storeName: string | null
  receiptDate: string | null
  totalAmount: number | null
  items: string | null
  uploadedAt: string
  transaction: {
    id: string
    description: string
    amount: number
    category: { name: string; icon: string | null } | null
  } | null
}

export default function ReceiptsPage() {
  const [uploading, setUploading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [result, setResult] = useState<ReceiptResult | null>(null)
  const [linked, setLinked] = useState<{ transactionId: string; message: string } | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryReceipt[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/receipt')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    setResult(null)
    setLinked(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/receipt', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        toast.error(data.error)
      } else {
        setResult(data)
        toast.success(data.message)
      }
    } catch {
      setError('Er is iets misgegaan bij het uploaden')
    } finally {
      setUploading(false)
    }
  }

  async function handleLinkTransaction(transactionId: string) {
    if (!result) return
    setLinking(true)
    try {
      const res = await fetch('/api/receipt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: result.receiptId, transactionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        setLinked(data)
        toast.success(data.message)
        if (showHistory) loadHistory()
      }
    } catch {
      toast.error('Er is iets misgegaan bij het koppelen')
    } finally {
      setLinking(false)
    }
  }

  async function handleCreateNew() {
    if (!result) return
    setLinking(true)
    try {
      const res = await fetch('/api/receipt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: result.receiptId, createNew: true, categoryId: result.categoryId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        setLinked(data)
        toast.success(data.message)
        if (showHistory) loadHistory()
      }
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setLinking(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  function handleReset() {
    setResult(null)
    setLinked(null)
    setError('')
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bonnetjes scannen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload een foto van je bonnetje en koppel het aan een banktransactie</p>
      </div>

      <Card className="premium-shadow border-border/50">
        <CardContent className="p-6 md:p-8">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 md:p-16 text-center transition-all duration-200 ${
              dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/60 hover:border-border'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {preview && !result ? (
              <div className="mx-auto max-w-[200px] mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Bonnetje preview" className="rounded-xl shadow-lg max-h-[200px] mx-auto object-contain" />
              </div>
            ) : (
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center mb-5">
                <Camera className="h-7 w-7 text-violet-500/60" />
              </div>
            )}

            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-lg font-semibold tracking-tight">AI leest je bonnetje...</p>
                <p className="text-sm text-muted-foreground">Dit kan een paar seconden duren</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold tracking-tight mb-1.5">
                  {result ? 'Nog een bonnetje uploaden?' : 'Sleep een foto van je bonnetje hierheen'}
                </p>
                <p className="text-sm text-muted-foreground mb-5">JPG, PNG, WebP of HEIC (max 10MB)</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl h-10">
                    <Camera className="h-4 w-4 mr-2" />
                    Foto maken / kiezen
                  </Button>
                  {result && (
                    <Button onClick={handleReset} variant="outline" className="rounded-xl h-10">
                      Reset
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Receipt scan result */}
      {result && !linked && (
        <Card className="border-blue-200/60 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40 premium-shadow">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-800 dark:text-blue-200">Bonnetje gescand</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">{result.message}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{result.storeName}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Winkel</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        {result.date ? new Date(result.date).toLocaleDateString('nl-NL') : 'Vandaag'}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Datum</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        &euro;{result.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Totaal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{result.category}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Categorie</p>
                    </div>
                  </div>
                </div>

                {result.items.length > 0 && (
                  <div className="mt-4 border-t border-blue-200/60 dark:border-blue-800/40 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">Producten ({result.items.length})</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {result.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-blue-800 dark:text-blue-200">
                            {item.quantity > 1 && <span className="text-blue-600">{item.quantity}x </span>}
                            {item.name}
                          </span>
                          <span className="font-medium text-blue-800 dark:text-blue-200 tabular-nums">
                            &euro;{item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matching transactions to link */}
      {result && !linked && (
        <Card className="premium-shadow border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Koppel aan een banktransactie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {result.matchingTransactions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  De volgende transacties komen overeen met dit bonnetje. Kies de juiste om te koppelen:
                </p>
                {result.matchingTransactions.map(t => (
                  <button
                    key={t.id}
                    disabled={linking}
                    onClick={() => handleLinkTransaction(t.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Link2 className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString('nl-NL')}
                          {t.category && ` · ${t.category.icon || ''} ${t.category.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <p className="text-sm font-semibold tabular-nums text-red-600">
                        &euro;{t.amount.toFixed(2)}
                      </p>
                      {linking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-primary font-medium">Koppelen</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Geen overeenkomende banktransacties gevonden rondom {result.date ? new Date(result.date).toLocaleDateString('nl-NL') : 'vandaag'} voor &euro;{result.totalAmount.toFixed(2)}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl w-full"
                disabled={linking}
                onClick={handleCreateNew}
              >
                {linking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Toch als nieuwe transactie toevoegen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Successfully linked */}
      {linked && (
        <Card className="border-blue-200/60 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40 premium-shadow">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200">Bonnetje gekoppeld</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">{linked.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200/60 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/40 premium-shadow">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Verwerking mislukt</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History section */}
      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold tracking-tight">Eerder gescande bonnetjes</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                if (!showHistory) loadHistory()
                setShowHistory(!showHistory)
              }}
            >
              <ImageIcon className="h-4 w-4 mr-1.5" />
              {showHistory ? 'Verbergen' : 'Tonen'}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="pt-0">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nog geen bonnetjes gescand</p>
            ) : (
              <div className="space-y-2">
                {history.map(r => {
                  let items: ReceiptItem[] = []
                  try { if (r.items) items = JSON.parse(r.items) } catch { /* invalid JSON */ }
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Receipt className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.storeName || r.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.uploadedAt).toLocaleDateString('nl-NL')}
                            {items.length > 0 && ` · ${items.length} producten`}
                            {r.transaction?.category && ` · ${r.transaction.category.icon || ''} ${r.transaction.category.name}`}
                            {r.transaction ? (
                              <span className="text-blue-600 ml-1">· Gekoppeld</span>
                            ) : (
                              <span className="text-amber-600 ml-1">· Niet gekoppeld</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold tabular-nums shrink-0 ml-3">
                        &euro;{(r.totalAmount || r.transaction?.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Hoe werkt het?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>Maak een <strong className="text-foreground">foto</strong> van je kassabon of bonnetje</li>
            <li>AI <strong className="text-foreground">leest automatisch</strong> de winkelnaam, datum, producten en totaalbedrag</li>
            <li>Het systeem zoekt automatisch naar <strong className="text-foreground">overeenkomende banktransacties</strong> op basis van bedrag en datum</li>
            <li>Kies de juiste transactie om het bonnetje aan te <strong className="text-foreground">koppelen</strong></li>
            <li>De producten worden opgeslagen in de <strong className="text-foreground">notities</strong> van de transactie</li>
            <li>Geen match? Je kunt het bonnetje ook als <strong className="text-foreground">nieuwe transactie</strong> toevoegen</li>
          </ul>
          <p className="pt-1">
            <strong className="text-foreground">Tip:</strong> Upload je bankafschrift eerst via &quot;Upload&quot; zodat de transacties al in het systeem staan voordat je bonnetjes scant.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
