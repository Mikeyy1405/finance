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
      <h1 className="text-2xl font-bold">Bankafschrift uploaden</h1>

      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">Sleep je CSV-bestand hierheen</p>
            <p className="text-sm text-muted-foreground mb-4">of klik om een bestand te selecteren</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              {uploading ? 'Bezig met uploaden...' : 'Bestand kiezen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Upload geslaagd</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">{result.message}</p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{result.total}</p>
                    <p className="text-xs text-green-600">Totaal</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{result.categorized}</p>
                    <p className="text-xs text-green-600">Gecategoriseerd</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{result.uncategorized}</p>
                    <p className="text-xs text-yellow-600">Zonder categorie</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Upload mislukt</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ondersteunde formaten</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Upload een CSV-bestand van je bank. De volgende banken/formaten worden ondersteund:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>ING</strong> - Download via Mijn ING &gt; Af- en bijschrijvingen &gt; Downloaden</li>
            <li><strong>ABN AMRO</strong> - Download via Internet Bankieren &gt; Mutaties &gt; Downloaden</li>
            <li><strong>Rabobank</strong> - Download via Rabo Online &gt; Transacties &gt; Exporteren</li>
            <li><strong>SNS / ASN / RegioBank</strong> - Download als CSV via je online bankieren</li>
            <li><strong>Overig</strong> - Elk CSV-bestand met datum, omschrijving en bedrag kolommen</li>
          </ul>
          <p className="mt-3">
            Transacties worden automatisch gecategoriseerd op basis van de keywords in je categorieen.
            Je kunt niet-gecategoriseerde transacties handmatig een categorie toewijzen via het Transacties overzicht.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
