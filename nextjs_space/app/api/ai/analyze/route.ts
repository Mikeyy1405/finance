import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { aiAnalyzeMonth } from '@/lib/aiml'
import { getMonthName } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { month, year } = await req.json()

    if (!process.env.AIML_API_KEY) {
      return NextResponse.json({ error: 'AIML_API_KEY is niet geconfigureerd' }, { status: 400 })
    }

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    // Gather all data
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lt: end } },
      include: { category: true },
    })

    const income = transactions.filter(t => t.type === 'income')
    const expenses = transactions.filter(t => t.type === 'expense')
    const totalIncome = income.reduce((s, t) => s + t.amount, 0)
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
    const savings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

    // Category breakdown
    const catTotals: Record<string, { name: string; total: number; count: number }> = {}
    for (const t of expenses) {
      const name = t.category?.name || 'Zonder categorie'
      if (!catTotals[name]) catTotals[name] = { name, total: 0, count: 0 }
      catTotals[name].total += t.amount
      catTotals[name].count += 1
    }
    const categoryBreakdown = Object.values(catTotals)
      .map(c => ({ ...c, percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)

    // Top expenses
    const topExpenses = [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({ description: t.description, amount: t.amount, category: t.category?.name || 'Onbekend' }))

    // Budget overruns
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, month, year },
      include: { category: true },
    })
    const budgetOverruns = budgets
      .map(b => {
        const spent = expenses.filter(t => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0)
        return { category: b.category.name, budget: b.amount, spent }
      })
      .filter(b => b.spent > b.budget)

    // Trend (last 6 months)
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const m = new Date(year, month - 1 - i, 1)
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      const inc = await prisma.transaction.aggregate({
        where: { userId: user.id, type: 'income', date: { gte: m, lt: mEnd } },
        _sum: { amount: true },
      })
      const exp = await prisma.transaction.aggregate({
        where: { userId: user.id, type: 'expense', date: { gte: m, lt: mEnd } },
        _sum: { amount: true },
      })
      trend.push({
        month: `${getMonthName(m.getMonth() + 1)} ${m.getFullYear()}`,
        income: inc._sum.amount || 0,
        expenses: exp._sum.amount || 0,
      })
    }

    const uncategorizedCount = expenses.filter(t => !t.category).length

    const analysis = await aiAnalyzeMonth({
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      categoryBreakdown,
      topExpenses,
      trend,
      uncategorizedCount,
      budgetOverruns,
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI analysis error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'AI analyse is mislukt. Controleer je AIML_API_KEY.' }, { status: 500 })
  }
}
