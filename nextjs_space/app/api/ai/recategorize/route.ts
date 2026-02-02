import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { aiCategorizeTransactions } from '@/lib/aiml'

// Re-categorize ALL transactions for a given month using AI
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { month, year } = await req.json()

    if (!process.env.AIML_API_KEY) {
      return NextResponse.json({ error: 'AIML_API_KEY is niet geconfigureerd' }, { status: 400 })
    }

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: start, lt: end },
      },
    })

    if (allTransactions.length === 0) {
      return NextResponse.json({ message: 'Geen transacties gevonden', updated: 0 })
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    })

    const toAI = allTransactions.map((t, i) => ({
      index: i,
      description: t.description,
      amount: t.amount,
      type: t.type,
    }))

    const aiResults = await aiCategorizeTransactions(toAI, categories)

    let updated = 0
    for (const [idxStr, catId] of Object.entries(aiResults)) {
      const idx = parseInt(idxStr)
      const tx = allTransactions[idx]
      if (tx) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { categoryId: catId },
        })
        updated++
      }
    }

    return NextResponse.json({
      message: `${updated} van ${allTransactions.length} transacties opnieuw gecategoriseerd door AI`,
      updated,
      total: allTransactions.length,
    })
  } catch (error) {
    console.error('AI recategorize error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Opnieuw categoriseren is mislukt' }, { status: 500 })
  }
}
