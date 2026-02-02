import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { parseCSV } from '@/lib/csv-parser'
import { parsePDF } from '@/lib/pdf-parser'
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

    const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'

    let parsed
    if (isPDF) {
      const arrayBuffer = await file.arrayBuffer()
      parsed = await parsePDF(Buffer.from(arrayBuffer))
    } else {
      const content = await file.text()
      parsed = parseCSV(content)
    }

    if (parsed.length === 0) {
      return NextResponse.json({ error: isPDF
        ? 'Geen transacties gevonden in het PDF-bestand. Controleer of het een bankafschrift is met transacties.'
        : 'Geen transacties gevonden in het bestand. Controleer het CSV-formaat.'
      }, { status: 400 })
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

    const transactionsData = parsed.map((t, index) => ({
      index,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      categoryId: null as string | null,
      userId: user.id,
      bankUploadId: upload.id,
    }))

    // Build a map from category ID to category type for syncing transaction types
    const categoryTypeMap = Object.fromEntries(categories.map(c => [c.id, c.type]))

    // Step 1: AI-first categorization — send ALL transactions to AI
    let aiCategorized = 0
    const hasAimlKey = !!process.env.AIML_API_KEY

    if (hasAimlKey) {
      try {
        const allForAI = transactionsData.map(t => ({
          index: t.index, description: t.description, amount: t.amount, type: t.type,
        }))

        const aiResults = await aiCategorizeTransactions(
          allForAI,
          categories.map(c => ({ id: c.id, name: c.name, type: c.type }))
        )

        for (const [idxStr, catId] of Object.entries(aiResults)) {
          const idx = parseInt(idxStr)
          const tx = transactionsData.find(t => t.index === idx)
          if (tx) {
            tx.categoryId = catId
            // Sync transaction type with the assigned category's type
            const catType = categoryTypeMap[catId]
            if (catType) tx.type = catType as "expense" | "income" | "transfer"
            aiCategorized++
          }
        }
      } catch (err) {
        console.error('AI categorization failed, falling back to keyword matching:', err)
      }
    }

    // Step 2: Keyword fallback — only for transactions AI didn't categorize
    let keywordCategorized = 0
    for (const tx of transactionsData) {
      if (!tx.categoryId) {
        const matchingCats = categories.filter(c => c.type === tx.type)
        const catId = autoCategorize(tx.description, matchingCats)
        if (catId) {
          tx.categoryId = catId
          // Sync transaction type with the assigned category's type
          const catType = categoryTypeMap[catId]
          if (catType) tx.type = catType
          keywordCategorized++
        }
      }
    }

    // Insert all transactions
    await prisma.transaction.createMany({
      data: transactionsData.map(({ index: _index, ...rest }) => rest),
    })

    const totalCategorized = aiCategorized + keywordCategorized
    const uncategorizedCount = transactionsData.length - totalCategorized

    return NextResponse.json({
      uploadId: upload.id,
      total: parsed.length,
      categorized: totalCategorized,
      keywordCategorized,
      aiCategorized,
      uncategorized: uncategorizedCount,
      message: `${parsed.length} transacties geimporteerd (${aiCategorized} via AI, ${keywordCategorized} via keywords, ${uncategorizedCount} zonder categorie)`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Er is iets misgegaan bij het uploaden' }, { status: 500 })
  }
}
