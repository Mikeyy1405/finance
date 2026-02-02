import jwt from 'jsonwebtoken'

const API_BASE = 'https://api.enablebanking.com'

function getAppId(): string {
  const id = process.env.ENABLE_BANKING_APP_ID
  if (!id) throw new Error('ENABLE_BANKING_APP_ID is niet geconfigureerd')
  return id
}

function getPrivateKey(): string {
  const key = process.env.ENABLE_BANKING_PRIVATE_KEY
  if (!key) throw new Error('ENABLE_BANKING_PRIVATE_KEY is niet geconfigureerd')
  // Support both inline (with \n) and actual newlines
  return key.replace(/\\n/g, '\n')
}

function createJWT(): string {
  const appId = getAppId()
  const privateKey = getPrivateKey()
  const now = Math.floor(Date.now() / 1000)

  return jwt.sign(
    {
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat: now,
      exp: now + 3600, // 1 hour
    },
    privateKey,
    {
      algorithm: 'RS256',
      header: { typ: 'JWT', alg: 'RS256', kid: appId },
    }
  )
}

async function apiRequest(method: string, path: string, body?: unknown) {
  const token = createJWT()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EnableBanking API error ${res.status}: ${text}`)
  }

  return res.json()
}

// Start authorization flow - returns URL to redirect user to
export async function startAuth(redirectUrl: string, state: string, bankName = 'ING', country = 'NL') {
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 90) // 90 days access

  return apiRequest('POST', '/auth', {
    access: { valid_until: validUntil.toISOString() },
    aspsp: { name: bankName, country },
    state,
    redirect_url: redirectUrl,
    psu_type: 'personal',
  }) as Promise<{ url: string; authorization_id: string }>
}

// Exchange authorization code for session
export async function createSession(code: string) {
  return apiRequest('POST', '/sessions', { code }) as Promise<{
    session_id: string
    accounts: Array<{
      uid: string
      iban: string
      account_id: { iban: string }
      name?: string
    }>
    aspsp: { name: string; country: string }
    access: { valid_until: string }
  }>
}

// Get session info
export async function getSession(sessionId: string) {
  return apiRequest('GET', `/sessions/${sessionId}`)
}

// Delete/close session
export async function deleteSession(sessionId: string) {
  return apiRequest('DELETE', `/sessions/${sessionId}`)
}

// Get account balances
export async function getBalances(accountId: string) {
  return apiRequest('GET', `/accounts/${accountId}/balances`) as Promise<{
    balances: Array<{
      balance_amount: { amount: string; currency: string }
      balance_type: string
      reference_date: string
    }>
  }>
}

// Get account transactions
export async function getTransactions(
  accountId: string,
  dateFrom?: string,
  dateTo?: string,
  continuationKey?: string
) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  if (continuationKey) params.set('continuation_key', continuationKey)

  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest('GET', `/accounts/${accountId}/transactions${query}`) as Promise<{
    transactions: Array<{
      entry_reference?: string
      transaction_amount: { amount: string; currency: string }
      credit_debit_indicator: 'CRDT' | 'DBIT'
      status: string
      booking_date?: string
      value_date?: string
      transaction_date?: string
      debtor_name?: string
      creditor_name?: string
      remittance_information?: string[]
      balance_after_transaction?: { balance_amount: { amount: string } }
    }>
    continuation_key?: string
  }>
}

// List available banks for a country
export async function listBanks(country = 'NL') {
  return apiRequest('GET', `/aspsps?country=${country}`) as Promise<
    Array<{ name: string; country: string; logo?: string }>
  >
}
