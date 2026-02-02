import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getAccessibleUserIds } from '@/lib/collaborators'

export async function GET() {
  try {
    const user = await requireAuth()
    const userIds = await getAccessibleUserIds(user.id)
    const categories = await prisma.category.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const data = await req.json()

    const category = await prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon || null,
        color: data.color || null,
        keywords: data.keywords || null,
        userId: user.id,
      },
    })

    return NextResponse.json(category)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Categorie bestaat al' }, { status: 400 })
  }
}
