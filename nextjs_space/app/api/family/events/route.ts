import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getHouseholdMemberIds, getUserHousehold } from '@/lib/household'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const memberIds = await getHouseholdMemberIds(user.id)
    const where: any = { userId: { in: memberIds } }

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end = new Date(parseInt(year), parseInt(month), 1)
      where.date = { gte: start, lt: end }
    }

    const events = await prisma.familyEvent.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(events)
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const household = await getUserHousehold(user.id)

    const created = await prisma.familyEvent.create({
      data: {
        ...body,
        userId: user.id,
        householdId: household?.id ?? null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
