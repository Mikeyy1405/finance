import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const log = await prisma.waterLog.findFirst({
      where: {
        userId: user.id,
        date: { gte: today, lt: tomorrow },
      },
    })

    return NextResponse.json(log)
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await prisma.waterLog.findFirst({
      where: {
        userId: user.id,
        date: { gte: today, lt: tomorrow },
      },
    })

    if (existing) {
      const updated = await prisma.waterLog.update({
        where: { id: existing.id },
        data: { glasses: body.glasses },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.waterLog.create({
      data: { glasses: body.glasses, date: today, userId: user.id },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
