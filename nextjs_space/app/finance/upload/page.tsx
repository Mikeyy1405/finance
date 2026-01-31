'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResult {
  imported: number;
  total: number;
  errors: string[];
  categorized: number;
  uncategorized: number;
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Alleen CSV-bestanden worden ondersteund');
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/finance/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload mislukt');
        if (data.detectedHeaders) {
          toast.error(`Gevonden kolommen: ${data.detectedHeaders.join(', ')}`);
        }
      } else {
        setResult(data);
        toast.success(`${data.imported} transacties geïmporteerd`);
      }
    } catch {
      toast.error('Er ging iets mis bij het uploaden');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Afschriften importeren</h2>

      {/* Upload zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400">Bezig met importeren...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Sleep je CSV-bestand hierheen
                  </p>
                  <p className="text-sm text-gray-500">of klik om een bestand te kiezen</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import resultaat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Geïmporteerd</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{result.categorized}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gecategoriseerd</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{result.uncategorized}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Zonder categorie</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-600">{result.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Totaal verwerkt</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="flex items-center gap-2 text-sm font-medium text-red-600 mb-2">
                  <AlertCircle className="w-4 h-4" /> Fouten ({result.errors.length})
                </p>
                <ul className="text-sm text-red-500 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ondersteunde formaten
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
          <p>De volgende CSV-formaten worden automatisch herkend:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>ING</strong> - Download via &quot;Af- en bijschrijvingen&quot; &rarr; CSV</li>
            <li><strong>ABN AMRO</strong> - Download via &quot;Transacties&quot; &rarr; CSV</li>
            <li><strong>Rabobank</strong> - Download via &quot;Transacties&quot; &rarr; CSV</li>
            <li><strong>SNS / Volksbank</strong> - Download via transactieoverzicht</li>
            <li><strong>Overig</strong> - CSV met kolommen: datum, omschrijving, bedrag</li>
          </ul>
          <p className="text-xs text-gray-400">
            Transacties worden automatisch gecategoriseerd op basis van de omschrijving.
            Je kunt categorieën achteraf altijd aanpassen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
