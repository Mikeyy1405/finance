'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Er is iets misgegaan</h2>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Er is een onverwachte fout opgetreden.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  )
}
