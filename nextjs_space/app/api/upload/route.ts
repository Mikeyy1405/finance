import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { parseCSV } from '@/lib/csv-parser'
import { autoCategorize } from '@/lib/categorize'
import { aiCategorizeTransactions } from '@/lib/aiml'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geupload' }, { status: 400 })
    }

    const content = await file.text()
    const parsed = parseCSV(content)

    if (parsed.length === 0) {
      return NextResponse.json({ error: 'Geen transacties gevonden in het bestand. Controleer het CSV-formaat.' }, { status: 400 })
    }

    // Get user categories for auto-categorization
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, keywords: true, type: true },
    })

    const upload = await prisma.bankUpload.create({
      data: {
        filename: file.name,
        rowCount: parsed.length,
        userId: user.id,
      },
    })

    // Step 1: Keyword-based categorization
    const transactionsData = parsed.map((t, index) => {
      const matchingCats = categories.filter(c => c.type === t.type)
      const categoryId = autoCategorize(t.description, matchingCats)

      return {
        index,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        categoryId,
        userId: user.id,
        bankUploadId: upload.id,
      }
    })

    // Step 2: AI categorization for uncategorized transactions
    let aiCategorized = 0
    const hasAimlKey = !!process.env.AIML_API_KEY

    if (hasAimlKey) {
      const uncategorized = transactionsData
        .filter(t => !t.categoryId)
        .map(t => ({ index: t.index, description: t.description, amount: t.amount, type: t.type }))

      if (uncategorized.length > 0) {
        try {
          const aiResults = await aiCategorizeTransactions(
            uncategorized,
            categories.map(c => ({ id: c.id, name: c.name, type: c.type }))
          )

          for (const [idxStr, catId] of Object.entries(aiResults)) {
            const idx = parseInt(idxStr)
            const tx = transactionsData.find(t => t.index === idx)
            if (tx && !tx.categoryId) {
              tx.categoryId = catId
              aiCategorized++
            }
          }
        } catch (err) {
          console.error('AI categorization failed, falling back to keyword-only:', err)
        }
      }
    }

    // Insert all transactions
    await prisma.transaction.createMany({
      data: transactionsData.map(({ index: _index, ...rest }) => rest),
    })

    const keywordCategorized = transactionsData.filter(t => t.categoryId).length - aiCategorized
    const totalCategorized = keywordCategorized + aiCategorized
    const uncategorizedCount = transactionsData.length - totalCategorized

    return NextResponse.json({
      uploadId: upload.id,
      total: parsed.length,
      categorized: totalCategorized,
      keywordCategorized,
      aiCategorized,
      uncategorized: uncategorizedCount,
      message: `${parsed.length} transacties geimporteerd (${keywordCategorized} via keywords, ${aiCategorized} via AI, ${uncategorizedCount} zonder categorie)`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Er is iets misgegaan bij het uploaden' }, { status: 500 })
  }
}
