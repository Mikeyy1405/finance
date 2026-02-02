import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      include: { exercises: true },
      orderBy: { date: 'desc' },
      take: 20,
    })

    return NextResponse.json(workouts)
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

    const { exercises, ...workoutData } = body

    const created = await prisma.workout.create({
      data: {
        ...workoutData,
        userId: user.id,
        exercises: {
          create: exercises || [],
        },
      },
      include: { exercises: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
