interface CategoryMatch {
  id: string
  name: string
  keywords: string | null
}

export function autoCategorize(description: string, categories: CategoryMatch[]): string | null {
  const lower = description.toLowerCase()

  let bestMatch: string | null = null
  let bestScore = 0

  for (const cat of categories) {
    if (!cat.keywords) continue
    const keywords = cat.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)

    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestMatch = cat.id
        bestScore = keyword.length
      }
    }
  }

  return bestMatch
}
