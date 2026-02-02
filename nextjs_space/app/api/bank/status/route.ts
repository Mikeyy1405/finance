import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()

    const connections = await prisma.bankConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bankName: true,
        bankCountry: true,
        iban: true,
        status: true,
        validUntil: true,
        lastSynced: true,
        createdAt: true,
      },
    })

    // Auto-expire connections
    for (const conn of connections) {
      if (conn.status === 'active' && conn.validUntil && new Date() > conn.validUntil) {
        await prisma.bankConnection.update({
          where: { id: conn.id },
          data: { status: 'expired' },
        })
        conn.status = 'expired'
      }
    }

    return NextResponse.json(connections)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
