import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getHouseholdMemberIds, getUserHousehold } from '@/lib/household'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const memberIds = await getHouseholdMemberIds(user.id)

    const items = await prisma.groceryItem.findMany({
      where: { userId: { in: memberIds } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
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

    const created = await prisma.groceryItem.create({
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const checked = searchParams.get('checked')

    if (checked === 'true') {
      const memberIds = await getHouseholdMemberIds(user.id)
      await prisma.groceryItem.deleteMany({
        where: { userId: { in: memberIds }, checked: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing ?checked=true parameter' }, { status: 400 })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
