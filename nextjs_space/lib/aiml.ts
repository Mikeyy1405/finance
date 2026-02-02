const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions'

// Use Claude Sonnet 4.5 for categorization (fast + accurate)
// Use Claude Sonnet 4.5 for analysis too
const CATEGORIZE_MODEL = 'claude-sonnet-4-5'
const ANALYSIS_MODEL = 'claude-sonnet-4-5'

interface AimlMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export async function aimlChat(messages: AimlMessage[], temperature = 0.3, model?: string): Promise<string> {
  const apiKey = process.env.AIML_API_KEY
  if (!apiKey) throw new Error('AIML_API_KEY is niet geconfigureerd')

  const res = await fetch(AIML_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || CATEGORIZE_MODEL,
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

  // Process in batches of 30 (smaller batches = more accurate with complex model)
  const batchSize = 30
  const result: Record<number, string> = {}

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)

    const transactionLines = batch.map(t =>
      `${t.index}|${t.type}|€${t.amount.toFixed(2)}|${t.description}`
    ).join('\n')

    const response = await aimlChat([
      {
        role: 'system',
        content: `Je bent een expert in het categoriseren van Nederlandse banktransacties. Je herkent alle Nederlandse banken, winkels, bedrijven en diensten.

BELANGRIJK: Nederlandse bankafschriften bevatten vaak cryptische omschrijvingen zoals:
- "NL12INGB0001234567 AH to Go" → Boodschappen (Albert Heijn)
- "CCV*Thuisbezorgd.nl" → Uit eten
- "SEPA Overboeking Vattenfall" → Energie
- "iDEAL Bol.com" → kan Huishouden, Kleding, of Cadeaus zijn (kijk naar bedrag)
- "Betaalautomaat 12:34 Shell" → Transport
- IBANs, kaartnummers en locatiecodes moeten genegeerd worden

Beschikbare UITGAVEN categorieen:
${expenseCats.join('\n')}

Beschikbare INKOMSTEN categorieen:
${incomeCats.join('\n')}

REGELS:
1. Kijk naar de KERN van de omschrijving (bedrijfsnaam, dienst) en negeer IBAN-nummers, kaartnummers, datums, locaties
2. Bij twijfel: gebruik het bedrag als hint (€10-50 bij supermarkt = Boodschappen, €800+ maandelijks = Huur/Hypotheek of Salaris)
3. ELKE transactie MOET een categorie krijgen - gebruik "Overig" alleen als het echt niet te bepalen is
4. Geef per transactie ALLEEN: index|categorie-ID
5. Geen uitleg, geen extra tekst, alleen de regels met index|categorie-ID`
      },
      {
        role: 'user',
        content: `Categoriseer deze transacties:\n${transactionLines}`,
      }
    ], 0.1, CATEGORIZE_MODEL)

    // Parse response - handle various formats the model might return
    const lines = response.trim().split('\n')
    for (const line of lines) {
      const cleaned = line.trim().replace(/^[\s-*]+/, '')
      const parts = cleaned.split('|')
      if (parts.length >= 2) {
        const idx = parseInt(parts[0].trim())
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
  ], 0.5, ANALYSIS_MODEL)
}

export interface ReceiptData {
  storeName: string
  date: string | null
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  category: string | null
  categoryId: string | null
}

/**
 * Uses AI vision to read a receipt image and extract structured data.
 * Sends the image as base64 to Claude for OCR + parsing.
 */
export async function aiReadReceipt(
  base64Image: string,
  mimeType: string,
  categories: CategoryForAI[]
): Promise<ReceiptData> {
  const expenseCats = categories.filter(c => c.type === 'expense').map(c => `${c.id}: ${c.name}`)
  const incomeCats = categories.filter(c => c.type === 'income').map(c => `${c.id}: ${c.name}`)

  const response = await aimlChat([
    {
      role: 'system',
      content: `Je bent een expert in het lezen van kassabonnen en bonnetjes. Je extraheert gestructureerde data uit foto's van bonnetjes.

Beschikbare UITGAVEN categorieen:
${expenseCats.join('\n')}

Beschikbare INKOMSTEN categorieen:
${incomeCats.join('\n')}

Je antwoord MOET valid JSON zijn, zonder markdown code blocks, zonder extra tekst. Alleen de JSON.

JSON formaat:
{
  "storeName": "naam van de winkel",
  "date": "YYYY-MM-DD" of null als niet leesbaar,
  "items": [{"name": "product naam", "quantity": 1, "price": 1.99}],
  "totalAmount": 12.99,
  "category": "naam van de best passende categorie",
  "categoryId": "id van de best passende categorie"
}

REGELS:
1. Lees ALLE producten/items op het bonnetje
2. Bedragen in euro's (gebruik punt als decimaalteken)
3. Als het totaalbedrag zichtbaar is, gebruik dat. Anders tel de items op.
4. Kies de BEST passende categorie op basis van de winkel en producten
5. Supermarkten (Albert Heijn, Jumbo, Lidl, etc.) → Boodschappen
6. Restaurants/cafés → Uit eten
7. Kleding winkels → Kleding
8. Apotheek/drogist → Gezondheid
9. Als de datum niet leesbaar is, geef null`
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Lees dit bonnetje en extraheer alle informatie:' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      ],
    },
  ], 0.1, CATEGORIZE_MODEL)

  // Parse the JSON response, stripping any markdown code blocks
  const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const data = JSON.parse(cleaned)

  return {
    storeName: data.storeName || 'Onbekende winkel',
    date: data.date || null,
    items: Array.isArray(data.items) ? data.items : [],
    totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
    category: data.category || null,
    categoryId: data.categoryId || null,
  }
}
