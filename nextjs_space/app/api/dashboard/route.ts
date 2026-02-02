import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getAccessibleUserIds } from '@/lib/collaborators'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const userIds = await getAccessibleUserIds(user.id)
    const url = new URL(req.url)
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()))

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    // Totals
    const incomeAgg = await prisma.transaction.aggregate({
      where: { userId: { in: userIds }, type: 'income', date: { gte: start, lt: end } },
      _sum: { amount: true },
    })
    const expenseAgg = await prisma.transaction.aggregate({
      where: { userId: { in: userIds }, type: 'expense', date: { gte: start, lt: end } },
      _sum: { amount: true },
    })

    const transferAgg = await prisma.transaction.aggregate({
      where: { userId: { in: userIds }, type: 'transfer', date: { gte: start, lt: end } },
      _sum: { amount: true },
    })

    const totalIncome = incomeAgg._sum.amount || 0
    const totalExpenses = expenseAgg._sum.amount || 0
    const totalTransfers = transferAgg._sum.amount || 0

    // Spending by category
    const byCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: { in: userIds }, type: 'expense', date: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    })

    const categories = await prisma.category.findMany({
      where: { userId: { in: userIds } },
    })
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

    const categoryBreakdown = byCategory
      .map(g => ({
        categoryId: g.categoryId,
        category: g.categoryId ? catMap[g.categoryId] : null,
        total: g._sum.amount || 0,
        count: g._count,
      }))
      .sort((a, b) => b.total - a.total)

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: { in: userIds }, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 10,
    })

    // Monthly trend (last 6 months)
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const m = new Date(year, month - 1 - i, 1)
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      const inc = await prisma.transaction.aggregate({
        where: { userId: { in: userIds }, type: 'income', date: { gte: m, lt: mEnd } },
        _sum: { amount: true },
      })
      const exp = await prisma.transaction.aggregate({
        where: { userId: { in: userIds }, type: 'expense', date: { gte: m, lt: mEnd } },
        _sum: { amount: true },
      })
      const trf = await prisma.transaction.aggregate({
        where: { userId: { in: userIds }, type: 'transfer', date: { gte: m, lt: mEnd } },
        _sum: { amount: true },
      })
      trend.push({
        month: m.getMonth() + 1,
        year: m.getFullYear(),
        income: inc._sum.amount || 0,
        expenses: exp._sum.amount || 0,
        transfers: trf._sum.amount || 0,
      })
    }

    // Budget status
    const budgets = await prisma.budget.findMany({
      where: { userId: { in: userIds }, month, year },
      include: { category: true },
    })
    const budgetStatus = budgets.map(b => {
      const spent = byCategory.find(g => g.categoryId === b.categoryId)?._sum.amount || 0
      return { ...b, spent, remaining: b.amount - spent, percentage: b.amount > 0 ? (spent / b.amount) * 100 : 0 }
    })

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      totalTransfers,
      balance: totalIncome - totalExpenses - totalTransfers,
      categoryBreakdown,
      recentTransactions,
      trend,
      budgetStatus,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
