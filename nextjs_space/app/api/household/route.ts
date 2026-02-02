import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getUserHousehold } from '@/lib/household'

// GET: Get current user's household with members
export async function GET() {
  try {
    const user = await requireAuth()
    const household = await getUserHousehold(user.id)

    return NextResponse.json(household)
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new household
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Check if user already has a household
    const existing = await getUserHousehold(user.id)
    if (existing) {
      return NextResponse.json({ error: 'Je hebt al een gezin aangemaakt' }, { status: 400 })
    }

    const household = await prisma.household.create({
      data: {
        name: body.name || 'Mijn Gezin',
        members: {
          create: {
            userId: user.id,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json(household, { status: 201 })
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update household name
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Geen gezin gevonden' }, { status: 404 })
    }

    // Check if user is admin
    const membership = household.members.find((m) => m.user.id === user.id)
    if (membership?.role !== 'admin') {
      return NextResponse.json({ error: 'Alleen beheerders kunnen het gezin wijzigen' }, { status: 403 })
    }

    const updated = await prisma.household.update({
      where: { id: household.id },
      data: { name: body.name },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
