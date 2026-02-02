import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { isInSameHousehold } from '@/lib/household'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    let targetUserId = user.id
    if (memberId && memberId !== user.id) {
      const sameHousehold = await isInSameHousehold(user.id, memberId)
      if (!sameHousehold) {
        return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
      }
      targetUserId = memberId
    }

    const medications = await prisma.medication.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(medications)
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

    const created = await prisma.medication.create({
      data: { ...body, userId: user.id },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.status === 401 || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
