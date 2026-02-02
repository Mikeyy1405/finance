import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { aiReadReceipt } from '@/lib/aiml'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geupload' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ongeldig bestandstype. Upload een foto (JPG, PNG, WebP of HEIC).' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximaal 10MB.' },
        { status: 400 }
      )
    }

    // Convert to base64 for AI vision
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Get user categories for categorization
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    })

    // AI reads the receipt
    const receiptData = await aiReadReceipt(base64, file.type, categories)

    // Validate categoryId exists
    const validCategory = receiptData.categoryId
      ? categories.find((c: { id: string; name: string; type: string }) => c.id === receiptData.categoryId)
      : null

    // Parse the date
    let receiptDate: Date | null = null
    if (receiptData.date) {
      const parsed = new Date(receiptData.date)
      if (!isNaN(parsed.getTime())) receiptDate = parsed
    }

    // Search for matching bank transactions (not already linked to a receipt)
    const searchDate = receiptDate || new Date()
    const dateFrom = new Date(searchDate)
    dateFrom.setDate(dateFrom.getDate() - 5)
    const dateTo = new Date(searchDate)
    dateTo.setDate(dateTo.getDate() + 5)

    const amountMin = Math.abs(receiptData.totalAmount) * 0.9
    const amountMax = Math.abs(receiptData.totalAmount) * 1.1

    const matchingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: dateFrom, lte: dateTo },
        amount: { gte: amountMin, lte: amountMax },
        receipt: null, // not already linked to a receipt
      },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 10,
    })

    // Save receipt record without linking yet
    const receipt = await prisma.receipt.create({
      data: {
        filename: file.name,
        storeName: receiptData.storeName,
        receiptDate,
        totalAmount: receiptData.totalAmount,
        items: JSON.stringify(receiptData.items),
        rawText: JSON.stringify(receiptData),
        userId: user.id,
        transactionId: null,
      },
    })

    return NextResponse.json({
      receiptId: receipt.id,
      storeName: receiptData.storeName,
      date: receiptData.date,
      totalAmount: receiptData.totalAmount,
      items: receiptData.items,
      category: validCategory?.name || receiptData.category || 'Niet gecategoriseerd',
      categoryId: validCategory?.id || null,
      matchingTransactions: matchingTransactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category ? { name: t.category.name, icon: t.category.icon } : null,
        notes: t.notes,
      })),
      message: matchingTransactions.length > 0
        ? `Bonnetje van ${receiptData.storeName} gescand — ${matchingTransactions.length} mogelijke transactie(s) gevonden`
        : `Bonnetje van ${receiptData.storeName} gescand — geen match gevonden`,
    })
  } catch (error) {
    console.error('Receipt upload error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Kon het bonnetje niet lezen. Probeer een duidelijkere foto.' },
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het verwerken van het bonnetje' },
      { status: 500 }
    )
  }
}

// PATCH: link a receipt to an existing transaction, or create a new one
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const { receiptId, transactionId, createNew } = body

    if (!receiptId) {
      return NextResponse.json({ error: 'receiptId is vereist' }, { status: 400 })
    }

    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, userId: user.id },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Bonnetje niet gevonden' }, { status: 404 })
    }

    if (createNew) {
      // Create a new transaction (fallback when no match)
      const receiptData = receipt.rawText ? JSON.parse(receipt.rawText) : {}
      const items: { quantity: number; name: string; price: number }[] = receipt.items ? JSON.parse(receipt.items) : []

      const transaction = await prisma.transaction.create({
        data: {
          date: receipt.receiptDate || new Date(),
          description: receipt.storeName || 'Onbekende winkel',
          amount: Math.abs(receipt.totalAmount || 0),
          type: 'expense',
          categoryId: body.categoryId || receiptData.categoryId || null,
          userId: user.id,
          notes: items.length > 0
            ? items.map((i: { quantity: number; name: string; price: number }) => `${i.quantity}x ${i.name} €${i.price.toFixed(2)}`).join(', ')
            : null,
        },
      })

      await prisma.receipt.update({
        where: { id: receiptId },
        data: { transactionId: transaction.id },
      })

      return NextResponse.json({
        linked: true,
        transactionId: transaction.id,
        message: `Nieuwe transactie aangemaakt en bonnetje gekoppeld`,
      })
    }

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is vereist' }, { status: 400 })
    }

    // Verify the transaction belongs to the user and isn't already linked
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: user.id },
      include: { receipt: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transactie niet gevonden' }, { status: 404 })
    }

    if (transaction.receipt) {
      return NextResponse.json({ error: 'Deze transactie heeft al een bonnetje' }, { status: 409 })
    }

    // Link receipt to transaction and add item details as notes
    const items: { quantity: number; name: string; price: number }[] = receipt.items ? JSON.parse(receipt.items) : []
    const notesText = items.length > 0
      ? items.map((i: { quantity: number; name: string; price: number }) => `${i.quantity}x ${i.name} €${i.price.toFixed(2)}`).join(', ')
      : null

    await prisma.$transaction([
      prisma.receipt.update({
        where: { id: receiptId },
        data: { transactionId },
      }),
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          notes: notesText || transaction.notes,
        },
      }),
    ])

    return NextResponse.json({
      linked: true,
      transactionId,
      message: `Bonnetje gekoppeld aan transactie "${transaction.description}"`,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Receipt link error:', error)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

// GET: list user's receipts
export async function GET() {
  try {
    const user = await requireAuth()
    const { getAccessibleUserIds } = await import('@/lib/collaborators')
    const userIds = await getAccessibleUserIds(user.id)

    const receipts = await prisma.receipt.findMany({
      where: { userId: { in: userIds } },
      include: {
        transaction: {
          include: { category: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(receipts)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
