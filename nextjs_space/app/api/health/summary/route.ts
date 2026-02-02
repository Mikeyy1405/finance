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

    const [latestWeight, todayWater, lastSleep, recentWorkoutsCount] = await Promise.all([
      prisma.weightLog.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      }),
      prisma.waterLog.findFirst({
        where: {
          userId: user.id,
          date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.sleepLog.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      }),
      prisma.workout.count({
        where: {
          userId: user.id,
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return NextResponse.json({
      latestWeight,
      todayWater,
      lastSleep,
      recentWorkoutsCount,
    })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
