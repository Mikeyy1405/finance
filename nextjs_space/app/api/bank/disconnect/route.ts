import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { deleteSession } from '@/lib/enable-banking'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { connectionId } = await req.json()

    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId: user.id },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Verbinding niet gevonden' }, { status: 404 })
    }

    // Try to close the session at EnableBanking
    if (connection.sessionId) {
      try {
        await deleteSession(connection.sessionId)
      } catch (err) {
        console.error('Failed to delete EnableBanking session:', err)
      }
    }

    await prisma.bankConnection.delete({ where: { id: connection.id } })

    return NextResponse.json({ message: 'Bankverbinding verwijderd' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}
