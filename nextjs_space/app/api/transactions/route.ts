import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const url = new URL(req.url)
    const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined
    const year = url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined
    const categoryId = url.searchParams.get('categoryId') || undefined
    const type = url.searchParams.get('type') || undefined

    const where: Record<string, unknown> = { userId: user.id }

    if (month && year) {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 1)
      where.date = { gte: start, lt: end }
    } else if (year) {
      const start = new Date(year, 0, 1)
      const end = new Date(year + 1, 0, 1)
      where.date = { gte: start, lt: end }
    }

    if (categoryId === 'none') where.categoryId = null
    else if (categoryId) where.categoryId = categoryId
    if (type) where.type = type

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const data = await req.json()

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(data.date),
        description: data.description,
        amount: Math.abs(parseFloat(data.amount)),
        type: data.type,
        categoryId: data.categoryId || null,
        userId: user.id,
        notes: data.notes || null,
      },
      include: { category: true },
    })

    return NextResponse.json(transaction)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
