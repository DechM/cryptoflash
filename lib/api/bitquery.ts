interface BitqueryResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    details?: unknown
    status?: number
  }>
}

export class BitqueryError extends Error {
  public readonly response?: unknown

  constructor(message: string, response?: unknown) {
    super(message)
    this.name = 'BitqueryError'
    this.response = response
  }
}

const BITQUERY_ENDPOINT = process.env.BITQUERY_ENDPOINT || 'https://graphql.bitquery.io'

const rawKeyList = (process.env.BITQUERY_API_KEYS || '')
  .split(',')
  .map(key => key.trim())
  .filter(Boolean)

const fallbackKey = process.env.BITQUERY_API_KEY?.trim()

const bitqueryKeys = rawKeyList.length > 0 ? rawKeyList : fallbackKey ? [fallbackKey] : []

let nextKeyIndex = 0

function getNextApiKey(): string {
  if (bitqueryKeys.length === 0) {
    throw new BitqueryError('No Bitquery API keys configured. Set BITQUERY_API_KEYS or BITQUERY_API_KEY.')
  }
  const key = bitqueryKeys[nextKeyIndex]
  nextKeyIndex = (nextKeyIndex + 1) % bitqueryKeys.length
  return key
}

function buildHeaders(apiKey: string): Record<string, string> {
  const isNewAuthKey = apiKey.startsWith('ory_')

  if (isNewAuthKey) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  }

  return {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey
  }
}

export async function bitqueryRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  options: { signal?: AbortSignal; retryCount?: number } = {}
): Promise<T> {
  const { signal, retryCount = 1 } = options
  let attempt = 0
  let lastError: unknown

  while (attempt <= retryCount) {
    const apiKey = getNextApiKey()
    const headers = buildHeaders(apiKey)
    try {
      const response = await fetch(BITQUERY_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        signal
      })

      if (!response.ok) {
        if (response.status >= 500 && attempt < retryCount) {
          attempt++
          await new Promise(resolve => setTimeout(resolve, 500 * attempt))
          continue
        }

        const text = await response.text()
        throw new BitqueryError(`Bitquery request failed with status ${response.status}`, text)
      }

      const payload = (await response.json()) as BitqueryResponse<T>

      if (payload.errors?.length) {
        const [error] = payload.errors
        throw new BitqueryError(error.message, payload.errors)
      }

      if (!payload.data) {
        throw new BitqueryError('Bitquery response missing data', payload)
      }

      return payload.data
    } catch (error) {
      lastError = error
      if (attempt >= retryCount) {
        break
      }
      attempt++
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
    }
  }

  throw (lastError instanceof Error ? lastError : new BitqueryError('Unknown Bitquery error', lastError))
}


