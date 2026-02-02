export interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
}

// Parses various Dutch bank CSV formats (ING, ABN AMRO, Rabobank, etc.)
export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // Detect delimiter
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','

  const headers = parseLine(firstLine, delimiter).map(h => h.toLowerCase().trim().replace(/"/g, ''))
  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseLine(line, delimiter)
    if (values.length < 2) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').replace(/^"|"$/g, '').trim()
    })

    const parsed = parseRow(row, headers)
    if (parsed) transactions.push(parsed)
  }

  return transactions
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseRow(row: Record<string, string>, headers: string[]): ParsedTransaction | null {
  // Try to find date
  const dateKey = headers.find(h =>
    h.includes('datum') || h.includes('date') || h === 'boekingsdatum' || h === 'transactiedatum'
  )
  // Try to find description
  const descKey = headers.find(h =>
    h.includes('omschrijving') || h.includes('naam') || h.includes('description') ||
    h.includes('naam / omschrijving') || h.includes('tegenrekening')
  )
  // Try to find amount
  const amountKey = headers.find(h =>
    h.includes('bedrag') || h.includes('amount') || h.includes('transactiebedrag') || h === 'bedrag (eur)'
  )
  // Some banks have separate debit/credit columns
  const debitKey = headers.find(h => h.includes('af') || h.includes('debet') || h.includes('debit'))
  const creditKey = headers.find(h => h.includes('bij') || h.includes('credit'))
  // ING-style: Af Bij column
  const directionKey = headers.find(h => h === 'af bij' || h === 'af/bij')

  if (!dateKey) return null

  const dateStr = row[dateKey]
  const date = parseDate(dateStr)
  if (!date) return null

  // Build description from available fields
  let description = ''
  if (descKey) description = row[descKey]
  // Also check "mededelingen" or "omschrijving-1" etc.
  const extraDescKeys = headers.filter(h =>
    h.includes('mededelingen') || h.includes('omschrijving') || h.includes('naam')
  )
  for (const k of extraDescKeys) {
    if (k !== descKey && row[k]) {
      description = description ? `${description} - ${row[k]}` : row[k]
    }
  }
  if (!description) description = 'Onbekende transactie'

  // Parse amount
  let amount = 0
  if (amountKey) {
    amount = parseAmount(row[amountKey])
    if (directionKey) {
      const dir = row[directionKey].toLowerCase()
      if (dir === 'af' || dir === 'debet') amount = -Math.abs(amount)
      else amount = Math.abs(amount)
    }
  } else if (debitKey && creditKey) {
    const debit = parseAmount(row[debitKey])
    const credit = parseAmount(row[creditKey])
    amount = credit > 0 ? credit : -debit
  }

  if (amount === 0) return null

  const absAmount = Math.abs(amount)
  const isTransfer = detectTransfer(description)

  return {
    date,
    description,
    amount: absAmount,
    type: isTransfer ? 'transfer' : (amount >= 0 ? 'income' : 'expense'),
  }
}

// Detect internal transfers (savings, investments, own accounts)
function detectTransfer(description: string): boolean {
  const desc = description.toLowerCase()
  const transferPatterns = [
    'naar oranje spaarrekening',
    'van oranje spaarrekening',
    'naar beleggingsrek',
    'van beleggingsrek',
    'spaarrekening',
    'saldo aanvullen',
    'overschrijving beleggingsrekening',
    'kosten beleggen',
    'naar eigen rekening',
    'van eigen rekening',
    'tussenrekening',
  ]
  return transferPatterns.some(p => desc.includes(p))
}

function parseDate(str: string): Date | null {
  if (!str) return null
  // Try YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    return new Date(`${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`)
  }
  // Try DD-MM-YYYY or DD/MM/YYYY
  const match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (match) {
    return new Date(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`)
  }
  // Try YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(str)
  // Fallback
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function parseAmount(str: string): number {
  if (!str) return 0
  // Dutch format: 1.234,56 -> 1234.56
  let cleaned = str.replace(/[^\d.,-]/g, '')
  // If comma is used as decimal separator
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}
