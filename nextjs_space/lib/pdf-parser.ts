// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

export interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
}

/**
 * Parses a PDF bank statement into transactions.
 * Supports common Dutch bank PDF formats (ING, ABN AMRO, Rabobank, etc.)
 * by extracting text and finding lines that look like transactions.
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedTransaction[]> {
  const parser = new pdfParse.PDFParse()
  await parser.load(buffer)
  const text: string = await parser.getText()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const transactions: ParsedTransaction[] = []

  for (const line of lines) {
    const parsed = tryParseLine(line)
    if (parsed) transactions.push(parsed)
  }

  // If line-by-line didn't work well, try multi-line grouping
  if (transactions.length === 0) {
    const grouped = tryGroupedParse(lines)
    transactions.push(...grouped)
  }

  return transactions
}

// Date patterns commonly found in Dutch bank PDFs
const DATE_PATTERNS = [
  /(\d{2}[-/.]\d{2}[-/.]\d{4})/,       // DD-MM-YYYY, DD.MM.YYYY, DD/MM/YYYY
  /(\d{2}[-/.]\d{2}[-/.]\d{2})\b/,      // DD-MM-YY
  /(\d{4}[-/.]\d{2}[-/.]\d{2})/,        // YYYY-MM-DD
  /(\d{1,2}\s+(?:jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?\s+\d{4})/i, // 1 jan 2024
]

// Amount patterns: 1.234,56 or 1234,56 or 1234.56
const AMOUNT_PATTERN = /[+-]?\s*(?:\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})\b/

function tryParseLine(line: string): ParsedTransaction | null {
  // Find a date in the line
  let dateStr: string | null = null
  let dateMatch: RegExpMatchArray | null = null
  for (const pattern of DATE_PATTERNS) {
    dateMatch = line.match(pattern)
    if (dateMatch) {
      dateStr = dateMatch[1]
      break
    }
  }
  if (!dateStr) return null

  // Find an amount
  const amountMatches = line.match(new RegExp(AMOUNT_PATTERN.source, 'g'))
  if (!amountMatches || amountMatches.length === 0) return null

  // Take the last amount match (usually the transaction amount)
  const amountStr = amountMatches[amountMatches.length - 1]
  const amount = parseAmount(amountStr)
  if (amount === 0) return null

  // Everything between date and amount is the description
  const dateEnd = line.indexOf(dateStr) + dateStr.length
  const amountStart = line.lastIndexOf(amountStr)
  let description = line.slice(dateEnd, amountStart).trim()

  // Clean up description
  description = description.replace(/^[-–\s]+/, '').replace(/[-–\s]+$/, '').trim()
  if (!description) description = 'Onbekende transactie'

  const date = parseDate(dateStr)
  if (!date) return null

  // Detect debit/credit from keywords or sign
  const isDebit = /\b(af|debet|debit)\b/i.test(line) || amountStr.trim().startsWith('-')

  return {
    date,
    description,
    amount: Math.abs(amount),
    type: detectTransfer(description) ? 'transfer' : (isDebit ? 'expense' : 'income'),
  }
}

function tryGroupedParse(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  let i = 0

  while (i < lines.length) {
    // Look for a line starting with a date
    let dateStr: string | null = null
    let dateMatch: RegExpMatchArray | null = null
    for (const pattern of DATE_PATTERNS) {
      dateMatch = lines[i].match(pattern)
      if (dateMatch) {
        dateStr = dateMatch[1]
        break
      }
    }

    if (!dateStr) {
      i++
      continue
    }

    const date = parseDate(dateStr)
    if (!date) {
      i++
      continue
    }

    // Collect following lines until we find an amount or another date
    let description = lines[i].slice(lines[i].indexOf(dateStr) + dateStr.length).trim()
    let amount = 0
    let found = false

    for (let j = i; j < Math.min(i + 5, lines.length); j++) {
      const amountMatch = lines[j].match(new RegExp(AMOUNT_PATTERN.source, 'g'))
      if (amountMatch) {
        amount = parseAmount(amountMatch[amountMatch.length - 1])
        if (amount !== 0) {
          if (j > i) {
            // Add intermediate lines to description
            for (let k = i + 1; k <= j; k++) {
              const lineText = lines[k].replace(new RegExp(AMOUNT_PATTERN.source, 'g'), '').trim()
              if (lineText) description += ' ' + lineText
            }
          }
          found = true
          i = j + 1
          break
        }
      }
    }

    if (!found) {
      i++
      continue
    }

    description = description.replace(/^[-–\s]+/, '').replace(/[-–\s]+$/, '').trim()
    if (!description) description = 'Onbekende transactie'

    const isDebit = description.toLowerCase().includes(' af') || amount < 0

    transactions.push({
      date,
      description,
      amount: Math.abs(amount),
      type: detectTransfer(description) ? 'transfer' : (isDebit ? 'expense' : 'income'),
    })
  }

  return transactions
}

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

  // DD-MM-YYYY / DD.MM.YYYY / DD/MM/YYYY
  let m = str.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/)
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`)

  // DD-MM-YY
  m = str.match(/^(\d{2})[-/.](\d{2})[-/.](\d{2})$/)
  if (m) {
    const year = parseInt(m[3]) > 50 ? `19${m[3]}` : `20${m[3]}`
    return new Date(`${year}-${m[2]}-${m[1]}`)
  }

  // YYYY-MM-DD
  m = str.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (m) return new Date(str.replace(/[/.]/g, '-'))

  // Dutch month names
  const months: Record<string, string> = {
    jan: '01', feb: '02', mrt: '03', mar: '03', apr: '04', mei: '05', may: '05',
    jun: '06', jul: '07', aug: '08', sep: '09', okt: '10', oct: '10', nov: '11', dec: '12',
  }
  m = str.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/i)
  if (m) {
    const monthKey = m[2].toLowerCase().slice(0, 3)
    const month = months[monthKey]
    if (month) return new Date(`${m[3]}-${month}-${m[1].padStart(2, '0')}`)
  }

  return null
}

function parseAmount(str: string): number {
  if (!str) return 0
  let cleaned = str.replace(/[^\d.,-]/g, '')
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}
