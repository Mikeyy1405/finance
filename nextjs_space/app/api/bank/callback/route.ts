import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/enable-banking'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is our connection ID

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/bank?error=missing_params', req.url))
    }

    // Verify the connection exists
    const connection = await prisma.bankConnection.findUnique({
      where: { id: state },
    })

    if (!connection) {
      return NextResponse.redirect(new URL('/dashboard/bank?error=invalid_state', req.url))
    }

    // Exchange code for session
    const session = await createSession(code)

    // Get the first account (or primary)
    const account = session.accounts?.[0]

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        sessionId: session.session_id,
        accountId: account?.uid || null,
        iban: account?.account_id?.iban || account?.iban || null,
        validUntil: session.access?.valid_until ? new Date(session.access.valid_until) : null,
        status: 'active',
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/dashboard/bank?success=true`)
  } catch (error) {
    console.error('Bank callback error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/dashboard/bank?error=auth_failed`)
  }
}
