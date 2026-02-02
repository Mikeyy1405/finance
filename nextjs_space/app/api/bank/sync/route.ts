import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getTransactions } from '@/lib/enable-banking'
import { autoCategorize } from '@/lib/categorize'
import { aiCategorizeTransactions } from '@/lib/aiml'

// Detect internal transfers
function detectTransferType(description: string): boolean {
  const desc = description.toLowerCase()
  const patterns = [
    'naar oranje spaarrekening', 'van oranje spaarrekening',
    'naar beleggingsrek', 'van beleggingsrek',
    'spaarrekening', 'saldo aanvullen',
    'overschrijving beleggingsrekening', 'kosten beleggen',
    'naar eigen rekening', 'van eigen rekening', 'tussenrekening',
  ]
  return patterns.some(p => desc.includes(p))
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { connectionId } = await req.json()

    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId: user.id, status: 'active' },
    })

    if (!connection || !connection.accountId) {
      return NextResponse.json({ error: 'Geen actieve bankverbinding gevonden' }, { status: 400 })
    }

    // Check if session is still valid
    if (connection.validUntil && new Date() > connection.validUntil) {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { status: 'expired' },
      })
      return NextResponse.json({ error: 'Banksessie is verlopen. Maak opnieuw verbinding.' }, { status: 400 })
    }

    // Determine date range: from last sync or last 90 days
    const dateFrom = connection.lastSynced
      ? connection.lastSynced.toISOString().split('T')[0]
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dateTo = new Date().toISOString().split('T')[0]

    // Fetch all transactions (with pagination)
    const allTransactions: Array<{
      entry_reference?: string
      transaction_amount: { amount: string; currency: string }
      credit_debit_indicator: 'CRDT' | 'DBIT'
      booking_date?: string
      value_date?: string
      transaction_date?: string
      creditor_name?: string
      debtor_name?: string
      remittance_information?: string[]
    }> = []

    let continuationKey: string | undefined
    do {
      const result = await getTransactions(connection.accountId, dateFrom, dateTo, continuationKey)
      allTransactions.push(...result.transactions)
      continuationKey = result.continuation_key
    } while (continuationKey)

    if (allTransactions.length === 0) {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { lastSynced: new Date() },
      })
      return NextResponse.json({ message: 'Geen nieuwe transacties gevonden', imported: 0 })
    }

    // Get user categories
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, keywords: true, type: true },
    })

    // Create bank upload record
    const upload = await prisma.bankUpload.create({
      data: {
        filename: `${connection.bankName} sync ${dateTo}`,
        rowCount: allTransactions.length,
        userId: user.id,
      },
    })

    // Convert EnableBanking transactions to our format
    const transactionsData = allTransactions.map((t, index) => {
      const isCredit = t.credit_debit_indicator === 'CRDT'
      const amount = Math.abs(parseFloat(t.transaction_amount.amount))
      const description = [
        t.creditor_name || t.debtor_name || '',
        ...(t.remittance_information || []),
      ].filter(Boolean).join(' - ') || 'Onbekende transactie'

      const date = t.booking_date || t.value_date || t.transaction_date || dateTo
      const isTransfer = detectTransferType(description)

      return {
        index,
        date: new Date(date),
        description,
        amount,
        type: isTransfer ? 'transfer' : (isCredit ? 'income' : 'expense'),
        categoryId: null as string | null,
        userId: user.id,
        bankUploadId: upload.id,
      }
    })

    // Deduplicate: skip transactions that already exist (same date, amount, description)
    const existingTxs = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: new Date(dateFrom), lte: new Date(dateTo + 'T23:59:59Z') },
      },
      select: { date: true, amount: true, description: true },
    })

    const existingSet = new Set(
      existingTxs.map(t => `${t.date.toISOString().split('T')[0]}|${t.amount}|${t.description.substring(0, 50)}`)
    )

    const newTransactions = transactionsData.filter(t => {
      const key = `${t.date.toISOString().split('T')[0]}|${t.amount}|${t.description.substring(0, 50)}`
      return !existingSet.has(key)
    })

    if (newTransactions.length === 0) {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { lastSynced: new Date() },
      })
      return NextResponse.json({ message: 'Alle transacties waren al geimporteerd', imported: 0 })
    }

    // AI categorization
    let aiCategorized = 0
    if (process.env.AIML_API_KEY) {
      try {
        const forAI = newTransactions.map(t => ({
          index: t.index, description: t.description, amount: t.amount, type: t.type,
        }))
        const aiResults = await aiCategorizeTransactions(
          forAI,
          categories.map(c => ({ id: c.id, name: c.name, type: c.type }))
        )
        for (const [idxStr, catId] of Object.entries(aiResults)) {
          const idx = parseInt(idxStr)
          const tx = newTransactions.find(t => t.index === idx)
          if (tx) { tx.categoryId = catId; aiCategorized++ }
        }
      } catch (err) {
        console.error('AI categorization failed during sync:', err)
      }
    }

    // Keyword fallback
    let keywordCategorized = 0
    for (const tx of newTransactions) {
      if (!tx.categoryId) {
        const matchingCats = categories.filter(c => c.type === tx.type)
        const catId = autoCategorize(tx.description, matchingCats)
        if (catId) { tx.categoryId = catId; keywordCategorized++ }
      }
    }

    // Insert transactions
    await prisma.transaction.createMany({
      data: newTransactions.map(({ index: _index, ...rest }) => rest),
    })

    // Update last synced
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { lastSynced: new Date() },
    })

    return NextResponse.json({
      message: `${newTransactions.length} transacties gesynchroniseerd van ${connection.bankName}`,
      imported: newTransactions.length,
      aiCategorized,
      keywordCategorized,
      skipped: transactionsData.length - newTransactions.length,
    })
  } catch (error) {
    console.error('Bank sync error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Synchronisatie mislukt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
