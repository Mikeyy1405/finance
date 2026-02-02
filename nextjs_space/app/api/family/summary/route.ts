import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getHouseholdMemberIds } from '@/lib/household'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const memberIds = await getHouseholdMemberIds(user.id)

    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const [upcomingEvents, pendingTasks, todayMeals] = await Promise.all([
      prisma.familyEvent.findMany({
        where: {
          userId: { in: memberIds },
          date: { gte: now, lte: nextWeek },
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.householdTask.findMany({
        where: {
          userId: { in: memberIds },
          completed: false,
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.mealPlan.findMany({
        where: {
          userId: { in: memberIds },
          date: { gte: today, lt: tomorrow },
        },
        include: { user: { select: { id: true, name: true } } },
      }),
    ])

    return NextResponse.json({ upcomingEvents, pendingTasks, todayMeals })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
