import { fetchTopCoins, fetchCoinDetails, CoinGeckoMarketCoin } from './api/coingecko'
import { bitqueryRequest, BitqueryError } from './api/bitquery'
import {
  NETWORKS,
  COINGECKO_PLATFORM_TO_NETWORK,
  NetworkConfig,
  STABLE_COIN_IDS,
  STABLE_PLATFORM_PRIORITY,
  DEFAULT_PLATFORM_PRIORITY,
  STABLE_ALLOWED_NETWORKS
} from './whales/networks'
import { supabaseAdmin } from './supabase'

export const MIN_WHALE_ALERT_USD = Number(process.env.WHALE_ALERT_MIN_USD || '5000')
export const DEFAULT_LOOKBACK_MINUTES = Number(process.env.WHALE_ALERT_LOOKBACK_MINUTES || '120')
export const MAX_RESULTS_PER_ASSET = Number(process.env.WHALE_ALERT_TRANSACTIONS_LIMIT || '3')

export type WhaleEventType = 'buy' | 'sell' | 'transfer'

export interface TopTokenRecord {
  token_address: string
  token_symbol: string | null
  token_name: string | null
  price_usd: number | null
  liquidity_usd: number | null
  volume_24h_usd: number | null
  txns_24h: number | null
  updated_at: string
  coingecko_id: string | null
  chain: string | null
  network: string | null
  contract_address: string | null
  source: string | null
}

export interface TrackedAsset extends TopTokenRecord {
  explorer_url: (hash: string) => string
  network_config: NetworkConfig
  asset_type: 'contract' | 'native'
}

interface BitqueryTradeRow {
  amountUsd: number
  amountTokens: number
  taker: string | null
  maker: string | null
  side: 'buy' | 'sell'
  txHash: string
  blockTime: string
  priceUsd: number | null
}

export interface WhaleDetectionResult {
  amountUsd: number
  amountTokens: number
  side: WhaleEventType
  txHash: string
  blockTime: string
  sender: string | null
  receiver: string | null
  priceUsd: number | null
}

const MANUAL_OVERRIDES: Record<
  string,
  {
    network: keyof typeof NETWORKS
    contract: string | null
    assetType?: 'native' | 'contract'
    tokenAddress?: string
  }
> = {
  ethereum: {
    network: 'ethereum',
    contract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
  },
  'binancecoin': {
    network: 'bsc',
    contract: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB
  }
}

const SKIP_COINS = new Set<string>(['bitcoin', 'internet-computer'])

const SUPPORTED_NETWORKS = new Set<keyof typeof NETWORKS>(Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>)

function toPrimaryKey(networkKey: string, contract: string | null, assetType: 'contract' | 'native'): string {
  if (contract) {
    return `${networkKey}:${contract.toLowerCase()}`
  }
  return `${networkKey}:native:${assetType}`
}

async function enrichCoinWithPlatform(
  coin: CoinGeckoMarketCoin
): Promise<{ coingecko_id: string; network: NetworkConfig; contract: string | null; assetType: 'contract' | 'native' } | null> {
  const override = MANUAL_OVERRIDES[coin.id]
  if (override) {
    const network = NETWORKS[override.network]
    if (!network) return null
    return {
      coingecko_id: coin.id,
      network,
      contract: override.contract,
      assetType: override.assetType ?? 'contract'
    }
  }

  const detail = await fetchCoinDetails(coin.id)
  const platforms = detail?.platforms ?? {}

  const isStable = STABLE_COIN_IDS.has(coin.id)

  type Candidate = {
    platform: string
    address: string
    networkKey: keyof typeof NETWORKS
  }

  const candidates: Candidate[] = []

  for (const [platformName, rawAddress] of Object.entries(platforms)) {
    if (typeof rawAddress !== 'string') continue
    const address = rawAddress.trim()
    if (!address) continue

    const normalizedPlatform = platformName.toLowerCase()
    const networkKey = COINGECKO_PLATFORM_TO_NETWORK[normalizedPlatform]
    if (!networkKey) continue
    if (!NETWORKS[networkKey]) continue

    candidates.push({
      platform: normalizedPlatform,
      address,
      networkKey
    })
  }

  if (!candidates.length) {
    return null
  }

  const priorityList = isStable ? STABLE_PLATFORM_PRIORITY : DEFAULT_PLATFORM_PRIORITY
  const priorityIndex = (platform: string) => {
    const idx = priorityList.indexOf(platform)
    return idx === -1 ? priorityList.length + 10 : idx
  }

  const sortedCandidates = [...candidates].sort((a, b) => priorityIndex(a.platform) - priorityIndex(b.platform))

  const chosen = sortedCandidates.find(candidate => {
    if (isStable && !STABLE_ALLOWED_NETWORKS.has(candidate.networkKey)) {
      return false
    }
    return true
  })

  if (!chosen) {
    return null
  }

  const network = NETWORKS[chosen.networkKey]
  if (!network) {
    return null
  }

  return {
    coingecko_id: coin.id,
    network,
    contract: chosen.address,
    assetType: 'contract'
  }
}

export async function listTrackedAssets(limit = 10): Promise<TrackedAsset[]> {
  const MAX_ATTEMPTS = limit * 2
  const coins = await fetchTopCoins(MAX_ATTEMPTS * 2)
  const assets: TrackedAsset[] = []
  const seenPrimaryKeys = new Set<string>()

  for (const coin of coins) {
    if (assets.length >= limit) {
      break
    }

    if (SKIP_COINS.has(coin.id)) {
      continue
    }

    let attempt = 0
    let handled = false

    while (attempt < 3 && !handled) {
      try {
        const enriched = await enrichCoinWithPlatform(coin)
        if (!enriched) {
          handled = true
          break
        }
        const { network, contract, assetType } = enriched

        if (!SUPPORTED_NETWORKS.has(network.key as keyof typeof NETWORKS)) {
          handled = true
          break
        }

        const tokenAddress = toPrimaryKey(network.key, contract, assetType)

        if (seenPrimaryKeys.has(tokenAddress)) {
          handled = true
          break
        }
        seenPrimaryKeys.add(tokenAddress)

        assets.push({
          token_address: tokenAddress,
          token_symbol: coin.symbol ? coin.symbol.toUpperCase() : null,
          token_name: coin.name ?? null,
          price_usd: coin.current_price ?? null,
          liquidity_usd: coin.market_cap ?? null,
          volume_24h_usd: coin.total_volume ?? null,
          txns_24h: null,
          updated_at: new Date().toISOString(),
          coingecko_id: coin.id,
          chain: network.displayName,
          network: network.key,
          contract_address: contract,
          source: 'coingecko',
          explorer_url: network.explorerTxUrl,
          network_config: network,
          asset_type: assetType
        })

        handled = true
      } catch (error) {
        const status =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status

        if (status === 429) {
          attempt++
          const retryAfterRaw =
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            (error as { response?: { headers?: Record<string, string> } }).response?.headers?.['retry-after']
          const retrySeconds = retryAfterRaw ? Number(retryAfterRaw) : 1
          const waitMs = Math.min(Math.max((retrySeconds || 1) * 1000, 1000), 5000)
          console.warn(`[Whale][CoinGecko] Rate limited on ${coin.id}. Retry ${attempt}/3 after ${waitMs}ms`)
          await delay(waitMs)
          if (attempt >= 3) {
            console.warn('[Whale][CoinGecko] Giving up on', coin.id, 'after repeated rate limits')
            handled = true
          }
          continue
        } else if (error instanceof BitqueryError) {
          console.warn('[Whale][CoinGecko] Failed to enrich coin', coin.id, error.message)
        } else {
          console.warn('[Whale][CoinGecko] Failed to enrich coin', coin.id, error)
        }
        handled = true
      }
    }

    await delay(700)
  }

  return assets
}

const EVM_WHALE_QUERY = /* GraphQL */ `
  query WhaleDexTrades(
    $network: EthereumNetwork!
    $currency: EthereumCurrencySelector!
    $since: ISO8601DateTime!
    $limit: Int!
  ) {
    ethereum(network: $network) {
      dexTrades(
        options: { limit: $limit, desc: "block.height" }
        date: { since: $since }
        baseCurrency: [$currency]
      ) {
        block {
          height
          timestamp {
            iso8601
          }
        }
        amountUsd: tradeAmount(in: USD)
        amountTokens: baseAmount(calculate: anyLast)
        side
        maker {
          address
        }
        taker {
          address
        }
        transaction {
          hash
        }
      }
    }
  }
`

interface EvmDexTradeRow {
  block?: {
    timestamp?: {
      iso8601?: string | null
    } | null
  } | null
  amountUsd?: number | null
  amountTokens?: number | null
  side?: string | null
  maker?: {
    address?: string | null
  } | null
  taker?: {
    address?: string | null
  } | null
  transaction?: {
    hash?: string | null
  } | null
}

function mapEvmRow(row: EvmDexTradeRow | null | undefined): BitqueryTradeRow | null {
  if (!row) return null
  const side = row.side?.toLowerCase()
  if (side !== 'buy' && side !== 'sell') return null

  const amountUsd = Number(row.amountUsd ?? 0)
  if (!Number.isFinite(amountUsd)) return null

  const amountTokens = Number(row.amountTokens ?? 0)
  const blockTime = row.block?.timestamp?.iso8601 ?? new Date().toISOString()

  const priceUsd =
    amountTokens && Number.isFinite(amountTokens) && amountTokens !== 0
      ? amountUsd / amountTokens
      : null

  return {
    amountUsd,
    amountTokens,
    taker: row.taker?.address ?? null,
    maker: row.maker?.address ?? null,
    side,
    txHash: row.transaction?.hash ?? '',
    blockTime,
    priceUsd: Number.isFinite(priceUsd) ? priceUsd : null
  }
}

export async function detectWhaleEventsForAsset(
  asset: TrackedAsset,
  options: { minUsd?: number; lookbackMinutes?: number; limit?: number } = {}
): Promise<WhaleDetectionResult[]> {
  const minUsd = options.minUsd ?? MIN_WHALE_ALERT_USD
  const lookbackMinutes = options.lookbackMinutes ?? DEFAULT_LOOKBACK_MINUTES
  const limit = options.limit ?? MAX_RESULTS_PER_ASSET
  const since = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString()

  if (!asset.contract_address && asset.asset_type !== 'native') {
    return []
  }

  let rows: BitqueryTradeRow[] = []

  if (asset.network_config.kind === 'evm') {
    if (!asset.contract_address) return []
    const payload = await bitqueryRequest<{ ethereum: { dexTrades?: EvmDexTradeRow[] } }>(EVM_WHALE_QUERY, {
      network: asset.network_config.bitqueryNetwork,
      currency: { is: asset.contract_address },
      since,
      limit
    })
    rows = (payload?.ethereum?.dexTrades ?? []).map(mapEvmRow).filter(Boolean) as BitqueryTradeRow[]
  } else {
    console.warn(
      `[Whale Detect] Unsupported network kind ${asset.network_config.kind} for ${asset.token_symbol ?? asset.token_address}`
    )
    return []
  }

  return rows
    .filter(row => row.amountUsd >= minUsd)
    .map(row => ({
      amountUsd: row.amountUsd,
      amountTokens: row.amountTokens,
      side: row.side,
      txHash: row.txHash,
      blockTime: row.blockTime,
      sender: row.maker,
      receiver: row.taker,
      priceUsd: row.priceUsd
    }))
}

export async function persistTopAssets(assets: TrackedAsset[]) {
  if (!assets.length) return

  const payload = assets.map(asset => ({
    token_address: asset.token_address,
    token_symbol: asset.token_symbol,
    token_name: asset.token_name,
    price_usd: asset.price_usd,
    liquidity_usd: asset.liquidity_usd,
    volume_24h_usd: asset.volume_24h_usd,
    txns_24h: asset.txns_24h,
    updated_at: asset.updated_at,
    coingecko_id: asset.coingecko_id,
    chain: asset.chain,
    network: asset.network,
    contract_address: asset.contract_address,
    source: asset.source
  }))

  await supabaseAdmin.from('whale_top_tokens').upsert(payload, { onConflict: 'token_address' })
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getWhaleSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from('whale_subscribers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data
}

export async function upsertWhaleSubscription(userId: string, values: Partial<import('./types').WhaleSubscriber>) {
  return supabaseAdmin.from('whale_subscribers').upsert({ user_id: userId, ...values }, { onConflict: 'user_id' })
}

export async function getDiscordLinkRecord(userId: string) {
  const { data } = await supabaseAdmin
    .from('discord_links')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data
}

