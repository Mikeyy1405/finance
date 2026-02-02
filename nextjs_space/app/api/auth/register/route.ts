import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'
import { defaultCategories } from '@/lib/categories-seed'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.trim()
    const password = body.password?.trim()
    const name = body.name?.trim()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Er bestaat al een account met dit e-mailadres' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
    })

    // Seed default categories
    await prisma.category.createMany({
      data: defaultCategories.map(c => ({
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        keywords: c.keywords,
        userId: user.id,
      })),
    })

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
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
