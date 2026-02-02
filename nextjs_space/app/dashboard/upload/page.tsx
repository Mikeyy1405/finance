'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    total: number; categorized: number; uncategorized: number; message: string
    keywordCategorized?: number; aiCategorized?: number
  } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bankafschrift uploaden</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Importeer transacties uit je bankafschrift</p>
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
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center mb-5">
              <Upload className="h-7 w-7 text-primary/60" />
            </div>
            <p className="text-lg font-semibold tracking-tight mb-1.5">Sleep je CSV-bestand hierheen</p>
            <p className="text-sm text-muted-foreground mb-5">of klik om een bestand te selecteren</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline" className="rounded-xl h-10">
              <FileText className="h-4 w-4 mr-2" />
              {uploading ? 'Bezig met uploaden...' : 'Bestand kiezen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 premium-shadow">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">Upload geslaagd</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">{result.message}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">{result.total}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Totaal</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">{result.keywordCategorized ?? result.categorized}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Via keywords</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">{result.aiCategorized ?? 0}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Via AI</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{result.uncategorized}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Zonder categorie</p>
                  </div>
                </div>
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
                <p className="font-semibold text-red-800 dark:text-red-200">Upload mislukt</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="premium-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Ondersteunde formaten</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p>Upload een CSV-bestand van je bank. De volgende banken/formaten worden ondersteund:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li><strong className="text-foreground">ING</strong> - Download via Mijn ING &gt; Af- en bijschrijvingen &gt; Downloaden</li>
            <li><strong className="text-foreground">ABN AMRO</strong> - Download via Internet Bankieren &gt; Mutaties &gt; Downloaden</li>
            <li><strong className="text-foreground">Rabobank</strong> - Download via Rabo Online &gt; Transacties &gt; Exporteren</li>
            <li><strong className="text-foreground">SNS / ASN / RegioBank</strong> - Download als CSV via je online bankieren</li>
            <li><strong className="text-foreground">Overig</strong> - Elk CSV-bestand met datum, omschrijving en bedrag kolommen</li>
          </ul>
          <p className="pt-1">
            Transacties worden automatisch gecategoriseerd op basis van de keywords in je categorieen.
            Je kunt niet-gecategoriseerde transacties handmatig een categorie toewijzen via het Transacties overzicht.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
