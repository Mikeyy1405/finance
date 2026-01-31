import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const budgets = await prisma.finance_budgets.findMany({
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });

    // Calculate spent per budget for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget: any) => {
        const result = await prisma.finance_transactions.aggregate({
          where: {
            categoryId: budget.categoryId,
            type: 'expense',
            date: { gte: startOfMonth, lt: endOfMonth },
          },
          _sum: { amount: true },
        });
        return {
          ...budget,
          spent: Math.abs(result._sum.amount || 0),
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const budget = await prisma.finance_budgets.create({
      data: {
        categoryId: body.categoryId,
        amount: parseFloat(body.amount),
        period: body.period || 'monthly',
      },
      include: { category: true },
    });
    return NextResponse.json(budget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const budget = await prisma.finance_budgets.update({
      where: { id: body.id },
      data: { amount: parseFloat(body.amount), period: body.period },
      include: { category: true },
    });
    return NextResponse.json(budget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });

    await prisma.finance_budgets.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
