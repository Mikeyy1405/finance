import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const data = await req.json()

    const existing = await prisma.category.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon ?? undefined,
        color: data.color ?? undefined,
        keywords: data.keywords ?? undefined,
      },
    })

    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existing = await prisma.category.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
