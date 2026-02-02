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

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: receiptDate || new Date(),
        description: receiptData.storeName,
        amount: Math.abs(receiptData.totalAmount),
        type: 'expense',
        categoryId: validCategory?.id || null,
        userId: user.id,
        notes: receiptData.items.length > 0
          ? receiptData.items.map(i => `${i.quantity}x ${i.name} €${i.price.toFixed(2)}`).join(', ')
          : null,
      },
    })

    // Save receipt record
    const receipt = await prisma.receipt.create({
      data: {
        filename: file.name,
        storeName: receiptData.storeName,
        receiptDate,
        totalAmount: receiptData.totalAmount,
        items: JSON.stringify(receiptData.items),
        rawText: JSON.stringify(receiptData),
        userId: user.id,
        transactionId: transaction.id,
      },
    })

    return NextResponse.json({
      receiptId: receipt.id,
      transactionId: transaction.id,
      storeName: receiptData.storeName,
      date: receiptData.date,
      totalAmount: receiptData.totalAmount,
      items: receiptData.items,
      category: validCategory?.name || receiptData.category || 'Niet gecategoriseerd',
      message: `Bonnetje van ${receiptData.storeName} verwerkt: €${receiptData.totalAmount.toFixed(2)}`,
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

// GET: list user's receipts
export async function GET() {
  try {
    const user = await requireAuth()

    const receipts = await prisma.receipt.findMany({
      where: { userId: user.id },
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
