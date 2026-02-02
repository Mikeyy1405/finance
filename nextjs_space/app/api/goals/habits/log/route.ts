import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { habitId, date } = body

    const habit = await prisma.habit.findUnique({ where: { id: habitId } })
    if (!habit || habit.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const logDate = new Date(date)
    logDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(logDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const existing = await prisma.habitLog.findFirst({
      where: {
        habitId,
        date: { gte: logDate, lt: nextDay },
      },
    })

    if (existing) {
      const updated = await prisma.habitLog.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.habitLog.create({
      data: {
        habitId,
        date: logDate,
        count: 1,
        userId: user.id,
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
