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
const BITQUERY_API_KEY = process.env.BITQUERY_API_KEY || ''

export async function bitqueryRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  options: { signal?: AbortSignal; retryCount?: number } = {}
): Promise<T> {
  if (!BITQUERY_API_KEY) {
    throw new BitqueryError('BITQUERY_API_KEY is not configured')
  }

  const { signal, retryCount = 1 } = options
  let attempt = 0
  let lastError: unknown

  while (attempt <= retryCount) {
    try {
      const response = await fetch(BITQUERY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': BITQUERY_API_KEY
        },
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


