import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // format: 2026-01

    const now = new Date();
    let startDate: Date, endDate: Date;

    if (month) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const where = { date: { gte: startDate, lt: endDate } };

    const [income, expenses, byCategory, recentTransactions] = await Promise.all([
      prisma.finance_transactions.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.finance_transactions.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
      prisma.finance_transactions.groupBy({
        by: ['categoryId'],
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.finance_transactions.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    // Get category names for the groupBy
    const categoryIds = byCategory.map((c: any) => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.finance_categories.findMany({
      where: { id: { in: categoryIds } },
    });
    const catMap = Object.fromEntries(categories.map((c: any) => [c.id, c]));

    const categoryBreakdown = byCategory.map((c: any) => ({
      categoryId: c.categoryId,
      category: c.categoryId ? catMap[c.categoryId] : null,
      total: c._sum.amount || 0,
    }));

    return NextResponse.json({
      totalIncome: income._sum.amount || 0,
      totalExpenses: expenses._sum.amount || 0,
      balance: (income._sum.amount || 0) - (expenses._sum.amount || 0),
      categoryBreakdown,
      recentTransactions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
