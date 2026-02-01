import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 })
    }

    const token = createToken({ id: user.id, email: user.email, name: user.name })

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    const message = error instanceof Error ? error.message : 'Onbekende fout'
    return NextResponse.json({ error: `Er is iets misgegaan: ${message}` }, { status: 500 })
  }
}
