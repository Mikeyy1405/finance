import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { aiCategorizeTransactions } from '@/lib/aiml'

// Re-categorize uncategorized transactions for a given month using AI
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { month, year } = await req.json()

    if (!process.env.AIML_API_KEY) {
      return NextResponse.json({ error: 'AIML_API_KEY is niet geconfigureerd' }, { status: 400 })
    }

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    // Get uncategorized transactions
    const uncategorized = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        categoryId: null,
        date: { gte: start, lt: end },
      },
    })

    if (uncategorized.length === 0) {
      return NextResponse.json({ message: 'Alle transacties zijn al gecategoriseerd', updated: 0 })
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    })

    const toAI = uncategorized.map((t, i) => ({
      index: i,
      description: t.description,
      amount: t.amount,
      type: t.type,
    }))

    const aiResults = await aiCategorizeTransactions(toAI, categories)

    // Build a map from category ID to category type for syncing transaction types
    const categoryTypeMap = Object.fromEntries(categories.map(c => [c.id, c.type]))

    let updated = 0
    for (const [idxStr, catId] of Object.entries(aiResults)) {
      const idx = parseInt(idxStr)
      const tx = uncategorized[idx]
      if (tx) {
        const catType = categoryTypeMap[catId]
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            categoryId: catId,
            ...(catType && catType !== tx.type ? { type: catType } : {}),
          },
        })
        updated++
      }
    }

    return NextResponse.json({
      message: `${updated} van ${uncategorized.length} transacties gecategoriseerd door AI`,
      updated,
      total: uncategorized.length,
    })
  } catch (error) {
    console.error('AI categorize error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'AI categorisatie is mislukt' }, { status: 500 })
  }
}
