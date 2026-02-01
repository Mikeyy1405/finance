const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions'

interface AimlMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function aimlChat(messages: AimlMessage[], temperature = 0.3): Promise<string> {
  const apiKey = process.env.AIML_API_KEY
  if (!apiKey) throw new Error('AIML_API_KEY is niet geconfigureerd')

  const res = await fetch(AIML_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AIML API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

interface CategoryForAI {
  id: string
  name: string
  type: string
}

interface TransactionForAI {
  index: number
  description: string
  amount: number
  type: string
}

/**
 * Uses AI to categorize transactions that couldn't be matched by keywords.
 * Sends transactions in batches to minimize API calls.
 */
export async function aiCategorizeTransactions(
  transactions: TransactionForAI[],
  categories: CategoryForAI[]
): Promise<Record<number, string>> {
  if (transactions.length === 0) return {}

  const expenseCats = categories.filter(c => c.type === 'expense').map(c => `${c.id}: ${c.name}`)
  const incomeCats = categories.filter(c => c.type === 'income').map(c => `${c.id}: ${c.name}`)

  // Process in batches of 50
  const batchSize = 50
  const result: Record<number, string> = {}

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)

    const transactionLines = batch.map(t =>
      `${t.index}|${t.type}|${t.amount}|${t.description}`
    ).join('\n')

    const response = await aimlChat([
      {
        role: 'system',
        content: `Je bent een Nederlandse financiele assistent die banktransacties categoriseert.

Beschikbare UITGAVEN categorieen:
${expenseCats.join('\n')}

Beschikbare INKOMSTEN categorieen:
${incomeCats.join('\n')}

Je krijgt transacties in het formaat: index|type|bedrag|omschrijving
Geef per transactie ALLEEN de index en het categorie-ID terug, gescheiden door |, één per regel.
Als je het niet zeker weet, geef dan de meest waarschijnlijke categorie.
Geef ALLEEN de output, geen uitleg.`
      },
      {
        role: 'user',
        content: transactionLines,
      }
    ])

    // Parse response
    const lines = response.trim().split('\n')
    for (const line of lines) {
      const parts = line.trim().split('|')
      if (parts.length >= 2) {
        const idx = parseInt(parts[0])
        const catId = parts[1].trim()
        if (!isNaN(idx) && catId && categories.some(c => c.id === catId)) {
          result[idx] = catId
        }
      }
    }
  }

  return result
}

interface MonthlyData {
  totalIncome: number
  totalExpenses: number
  savings: number
  savingsRate: number
  categoryBreakdown: Array<{ name: string; total: number; percentage: number; count: number }>
  topExpenses: Array<{ description: string; amount: number; category: string }>
  trend: Array<{ month: string; income: number; expenses: number }>
  uncategorizedCount: number
  budgetOverruns: Array<{ category: string; budget: number; spent: number }>
}

/**
 * Generates a detailed AI-powered financial analysis for a given month.
 */
export async function aiAnalyzeMonth(data: MonthlyData): Promise<string> {
  const prompt = `Analyseer deze maandelijkse financiele gegevens en geef een gedetailleerd persoonlijk advies in het Nederlands.

OVERZICHT:
- Totaal inkomsten: €${data.totalIncome.toFixed(2)}
- Totaal uitgaven: €${data.totalExpenses.toFixed(2)}
- Gespaard: €${data.savings.toFixed(2)}
- Spaarpercentage: ${data.savingsRate.toFixed(1)}%
- Niet-gecategoriseerde transacties: ${data.uncategorizedCount}

UITGAVEN PER CATEGORIE:
${data.categoryBreakdown.map(c => `- ${c.name}: €${c.total.toFixed(2)} (${c.percentage.toFixed(1)}%, ${c.count} transacties)`).join('\n')}

TOP 5 GROOTSTE UITGAVEN:
${data.topExpenses.map(t => `- ${t.description}: €${t.amount.toFixed(2)} (${t.category})`).join('\n')}

BUDGET OVERSCHRIJDINGEN:
${data.budgetOverruns.length > 0 ? data.budgetOverruns.map(b => `- ${b.category}: €${b.spent.toFixed(2)} van €${b.budget.toFixed(2)} budget`).join('\n') : 'Geen overschrijdingen'}

TREND (LAATSTE MAANDEN):
${data.trend.map(t => `- ${t.month}: inkomsten €${t.income.toFixed(2)}, uitgaven €${t.expenses.toFixed(2)}`).join('\n')}

Geef een analyse met:
1. **Samenvatting** - Kort overzicht van de financiele gezondheid
2. **Sterke punten** - Waar gaat het goed?
3. **Aandachtspunten** - Waar kan het beter?
4. **Concrete bespaartips** - Specifiek gebaseerd op de categorieen met de hoogste uitgaven
5. **Budgetadvies** - Aanbevelingen voor budgetten gebaseerd op het bestedingspatroon
6. **Doelen** - Suggesties voor financiele doelen voor de komende maand

Wees specifiek, gebruik de daadwerkelijke bedragen en categorieen. Geef praktisch toepasbaar advies.`

  return aimlChat([
    {
      role: 'system',
      content: 'Je bent een ervaren Nederlandse financieel adviseur. Je analyseert persoonlijke financien en geeft helder, concreet en motiverend advies. Gebruik markdown formatting voor structuur.',
    },
    { role: 'user', content: prompt },
  ], 0.5)
}
