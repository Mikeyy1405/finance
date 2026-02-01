import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const url = new URL(req.url)
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()))

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, month, year },
      include: { category: true },
    })

    // Get actual spending per category for this month
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const transactions = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    })

    const spendingMap: Record<string, number> = {}
    for (const t of transactions) {
      if (t.categoryId) spendingMap[t.categoryId] = t._sum.amount || 0
    }

    const result = budgets.map(b => ({
      ...b,
      spent: spendingMap[b.categoryId] || 0,
      remaining: b.amount - (spendingMap[b.categoryId] || 0),
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const data = await req.json()

    const budget = await prisma.budget.upsert({
      where: {
        categoryId_month_year_userId: {
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
          userId: user.id,
        },
      },
      update: { amount: parseFloat(data.amount) },
      create: {
        amount: parseFloat(data.amount),
        month: data.month,
        year: data.year,
        categoryId: data.categoryId,
        userId: user.id,
      },
      include: { category: true },
    })

    return NextResponse.json(budget)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
