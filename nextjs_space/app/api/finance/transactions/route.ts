import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // format: 2026-01
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');

    const where: any = {};
    if (month) {
      const [year, m] = month.split('-').map(Number);
      where.date = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      };
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;

    const transactions = await prisma.finance_transactions.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transaction = await prisma.finance_transactions.create({
      data: {
        date: new Date(body.date),
        description: body.description,
        amount: parseFloat(body.amount),
        type: body.type,
        categoryId: body.categoryId || null,
        notes: body.notes || null,
        source: body.source || 'manual',
      },
      include: { category: true },
    });
    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });

    await prisma.finance_transactions.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
