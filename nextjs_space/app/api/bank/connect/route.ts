import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { startAuth } from '@/lib/enable-banking'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { bankName = 'ING', country = 'NL' } = await req.json()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${appUrl}/api/bank/callback`

    // Create a pending bank connection
    const connection = await prisma.bankConnection.create({
      data: {
        bankName,
        bankCountry: country,
        status: 'pending',
        userId: user.id,
      },
    })

    const result = await startAuth(redirectUrl, connection.id, bankName, country)

    return NextResponse.json({
      redirectUrl: result.url,
      connectionId: connection.id,
    })
  } catch (error) {
    console.error('Bank connect error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Bankverbinding starten mislukt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
