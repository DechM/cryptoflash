import axios, { AxiosInstance } from 'axios'

export interface CoinGeckoMarketCoin {
  id: string
  symbol: string
  name: string
  image?: string
  current_price?: number
  market_cap?: number
  total_volume?: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h_in_currency?: number
}

export interface CoinGeckoCoinDetails {
  id: string
  symbol: string
  name: string
  hashing_algorithm?: string | null
  description?: { en?: string }
  market_data?: {
    current_price?: Record<string, number>
  }
  platforms?: Record<string, string | null>
}

const PRO_BASE_URL = 'https://pro-api.coingecko.com/api/v3'
const PUBLIC_BASE_URL = 'https://api.coingecko.com/api/v3'

function createClient(): AxiosInstance {
  const rawKey = process.env.COINGECKO_API_KEY
  const apiKey = rawKey?.trim()
  const lowerKey = apiKey?.toLowerCase()

  let baseURL = PUBLIC_BASE_URL
  const headers: Record<string, string> = {}

  if (apiKey) {
    if (lowerKey === 'demo' || lowerKey === 'demokey') {
      baseURL = PUBLIC_BASE_URL
      headers['x-cg-demo-api-key'] = apiKey
    } else {
      baseURL = PRO_BASE_URL
      headers['x-cg-pro-api-key'] = apiKey
    }
  }

  return axios.create({
    baseURL,
    timeout: 8000,
    headers: Object.keys(headers).length ? headers : undefined
  })
}

const client = createClient()

export async function fetchTopCoins(limit = 20): Promise<CoinGeckoMarketCoin[]> {
  const perPage = Math.min(Math.max(limit, 1), 250)

  try {
    const response = await client.get<CoinGeckoMarketCoin[]>('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: perPage,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h',
        locale: 'en'
      }
    })

    return response.data ?? []
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = typeof error.response?.data === 'string' ? error.response?.data : JSON.stringify(error.response?.data)
      throw new Error(`[CoinGecko] Request failed with status ${status}: ${data}`)
    }
    throw error
  }
}

export async function fetchCoinDetails(id: string): Promise<CoinGeckoCoinDetails | null> {
  if (!id) return null

  try {
    const response = await client.get<CoinGeckoCoinDetails>(`/coins/${encodeURIComponent(id)}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: false,
        community_data: false,
        developer_data: false,
        sparkline: false
      }
    })
    return response.data ?? null
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 404) {
        console.warn(`[CoinGecko] Coin not found: ${id}`)
        return null
      }
    }
    throw error
  }
}


