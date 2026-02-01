import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { parseCSV } from '@/lib/csv-parser'
import { autoCategorize } from '@/lib/categorize'

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

    const transactionsData = parsed.map(t => {
      const matchingCats = categories.filter(c => c.type === t.type)
      const categoryId = autoCategorize(t.description, matchingCats)

      return {
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        categoryId,
        userId: user.id,
        bankUploadId: upload.id,
      }
    })

    await prisma.transaction.createMany({ data: transactionsData })

    const categorized = transactionsData.filter(t => t.categoryId).length
    const uncategorized = transactionsData.length - categorized

    return NextResponse.json({
      uploadId: upload.id,
      total: parsed.length,
      categorized,
      uncategorized,
      message: `${parsed.length} transacties geimporteerd (${categorized} automatisch gecategoriseerd, ${uncategorized} zonder categorie)`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Er is iets misgegaan bij het uploaden' }, { status: 500 })
  }
}
