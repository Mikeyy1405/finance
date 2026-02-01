import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const data = await req.json()

    const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        description: data.description,
        amount: data.amount !== undefined ? Math.abs(parseFloat(data.amount)) : undefined,
        type: data.type,
        categoryId: data.categoryId ?? undefined,
        notes: data.notes ?? undefined,
      },
      include: { category: true },
    })

    return NextResponse.json(transaction)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
