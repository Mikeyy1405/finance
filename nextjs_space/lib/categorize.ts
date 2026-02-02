interface CategoryMatch {
  id: string
  name: string
  keywords: string | null
}

/**
 * Normalizes a Dutch bank transaction description by stripping
 * IBANs, card numbers, dates, times, location codes, and other noise.
 */
function normalizeDescription(desc: string): string {
  let s = desc.toLowerCase()
  // Remove IBANs (NL12INGB0001234567)
  s = s.replace(/\b[a-z]{2}\d{2}[a-z]{4}\d{10}\b/g, ' ')
  // Remove card numbers and reference numbers
  s = s.replace(/\b\d{6,}\b/g, ' ')
  // Remove date patterns (DD-MM-YYYY, DD/MM/YYYY, YYYYMMDD)
  s = s.replace(/\b\d{2}[-/.]\d{2}[-/.]\d{2,4}\b/g, ' ')
  s = s.replace(/\b\d{8}\b/g, ' ')
  // Remove time patterns (HH:MM)
  s = s.replace(/\b\d{2}:\d{2}\b/g, ' ')
  // Remove common bank prefixes
  s = s.replace(/\b(sepa|overboeking|betaalautomaat|gea|bea|ideal|ccv\*|pin|incasso|storting|europees)\b/gi, ' ')
  // Remove pasvolgnr, transactie, etc.
  s = s.replace(/\b(pasvolgnr|transactie|omschrijving|kenmerk|machtiging|doorlopend)\b/gi, ' ')
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export function autoCategorize(description: string, categories: CategoryMatch[]): string | null {
  const normalized = normalizeDescription(description)
  const lower = description.toLowerCase()

  let bestMatch: string | null = null
  let bestScore = 0

  for (const cat of categories) {
    if (!cat.keywords) continue
    const keywords = cat.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)

    for (const keyword of keywords) {
      // Check both original and normalized description
      if ((lower.includes(keyword) || normalized.includes(keyword)) && keyword.length > bestScore) {
        bestMatch = cat.id
        bestScore = keyword.length
      }
    }
  }

  return bestMatch
}
