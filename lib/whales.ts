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

interface BitqueryTransferRow {
  amountUsdt: number
  baseAmount: number
  baseSymbol: string | null
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
  solana: {
    network: 'solana',
    contract: 'So11111111111111111111111111111111111111112',
    assetType: 'native'
  },
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
  const coins = await fetchTopCoins(limit * 2)
  const assets: TrackedAsset[] = []
  const seenPrimaryKeys = new Set<string>()

  for (const coin of coins) {
    if (SKIP_COINS.has(coin.id)) {
      continue
    }

    try {
      const enriched = await enrichCoinWithPlatform(coin)
      if (!enriched) continue
      const { network, contract, assetType } = enriched
      const tokenAddress = toPrimaryKey(network.key, contract, assetType)

      if (seenPrimaryKeys.has(tokenAddress)) {
        continue
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

      if (assets.length >= limit) break
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 429
      ) {
        console.warn('[Whale][CoinGecko] Rate limited while enriching coin', coin.id)
        break
      } else if (error instanceof BitqueryError) {
        console.warn('[Whale][CoinGecko] Failed to enrich coin', coin.id, error.message)
      } else {
        console.warn('[Whale][CoinGecko] Failed to enrich coin', coin.id, error)
      }
    }
    await delay(800)
  }

  return assets
}

const EVM_WHALE_QUERY = /* GraphQL */ `
  query WhaleDexTrades($network: EvmNetwork!, $contract: String!, $since: ISO8601DateTime!, $limit: Int!) {
    evm(network: $network) {
      dexTrades(
        limit: { count: $limit }
        orderBy: { descending: Block_Time }
        where: {
          Block: { Time: { since: $since } }
          Trade: { BaseCurrency: { SmartContract: { is: $contract } } }
        }
      ) {
        Block {
          Time
        }
        Trade {
          BaseAmount
          QuoteAmount
          PriceInUSD
          QuoteAmountInUSD
          Side {
            Type
          }
          Buyer {
            Address
          }
          Seller {
            Address
          }
          BaseCurrency {
            Symbol
          }
        }
        Transaction {
          Hash
        }
      }
    }
  }
`

const SOLANA_WHALE_QUERY = /* GraphQL */ `
  query SolanaDexTrades($mint: String!, $since: ISO8601DateTime!, $limit: Int!) {
    solana(network: solana) {
      dexTrades(
        limit: { count: $limit }
        orderBy: { descending: Block_Time }
        where: {
          Block: { Time: { since: $since } }
          Trade: { BaseCurrency: { MintAddress: { is: $mint } } }
        }
      ) {
        Block {
          Time
        }
        Trade {
          BaseAmount
          QuoteAmount
          PriceInUSD
          QuoteAmountInUSD
          Side {
            Type
          }
          Buyer {
            Address
          }
          Seller {
            Address
          }
          BaseCurrency {
            Symbol
          }
        }
        Transaction {
          Signature
        }
      }
    }
  }
`

interface EvmDexTradeRow {
  Block?: {
    Time?: string
  }
  Trade?: {
    BaseAmount?: number
    QuoteAmount?: number
    PriceInUSD?: number
    QuoteAmountInUSD?: number
    Side?: {
      Type?: string
    }
    Buyer?: { Address?: string }
    Seller?: { Address?: string }
    BaseCurrency?: { Symbol?: string }
  }
  Transaction?: {
    Hash?: string
  }
}

interface SolanaDexTradeRow {
  Block?: {
    Time?: string
  }
  Trade?: {
    BaseAmount?: number
    QuoteAmount?: number
    PriceInUSD?: number
    QuoteAmountInUSD?: number
    Side?: {
      Type?: string
    }
    Buyer?: { Address?: string }
    Seller?: { Address?: string }
    BaseCurrency?: { Symbol?: string }
  }
  Transaction?: {
    Signature?: string
  }
}

function mapEvmRow(row: EvmDexTradeRow | null | undefined): BitqueryTransferRow | null {
  if (!row) return null
  const side = row.Trade?.Side?.Type?.toLowerCase()
  if (side !== 'buy' && side !== 'sell') return null

  const amountUsd = Number(row.Trade?.QuoteAmountInUSD ?? row.Trade?.BaseAmount ?? 0)
  if (!Number.isFinite(amountUsd)) return null

  return {
    amountUsdt: amountUsd,
    baseAmount: Number(row.Trade?.BaseAmount ?? 0),
    baseSymbol: row.Trade?.BaseCurrency?.Symbol ?? null,
    taker: row.Trade?.Buyer?.Address ?? null,
    maker: row.Trade?.Seller?.Address ?? null,
    side,
    txHash: row.Transaction?.Hash ?? '',
    blockTime: row.Block?.Time ?? new Date().toISOString(),
    priceUsd: typeof row.Trade?.PriceInUSD === 'number' ? row.Trade.PriceInUSD : null
  }
}

function mapSolanaRow(row: SolanaDexTradeRow | null | undefined): BitqueryTransferRow | null {
  if (!row) return null
  const side = row.Trade?.Side?.Type?.toLowerCase()
  if (side !== 'buy' && side !== 'sell') return null

  const amountUsd = Number(row.Trade?.QuoteAmountInUSD ?? row.Trade?.BaseAmount ?? 0)
  if (!Number.isFinite(amountUsd)) return null

  return {
    amountUsdt: amountUsd,
    baseAmount: Number(row.Trade?.BaseAmount ?? 0),
    baseSymbol: row.Trade?.BaseCurrency?.Symbol ?? null,
    taker: row.Trade?.Buyer?.Address ?? null,
    maker: row.Trade?.Seller?.Address ?? null,
    side,
    txHash: row.Transaction?.Signature ?? '',
    blockTime: row.Block?.Time ?? new Date().toISOString(),
    priceUsd: typeof row.Trade?.PriceInUSD === 'number' ? row.Trade.PriceInUSD : null
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

  let rows: BitqueryTransferRow[] = []

  if (asset.network_config.kind === 'evm') {
    if (!asset.contract_address) return []
    const data = await bitqueryRequest<{ evm: { dexTrades?: EvmDexTradeRow[] } }>(EVM_WHALE_QUERY, {
      network: asset.network_config.bitqueryNetwork,
      contract: asset.contract_address,
      since,
      limit
    })
    rows = (data?.evm?.dexTrades ?? []).map(mapEvmRow).filter(Boolean) as BitqueryTransferRow[]
  } else if (asset.network_config.kind === 'solana') {
    const mint = asset.contract_address ?? 'So11111111111111111111111111111111111111112'
    const data = await bitqueryRequest<{ solana: { dexTrades?: SolanaDexTradeRow[] } }>(SOLANA_WHALE_QUERY, {
      mint,
      since,
      limit
    })
    rows = (data?.solana?.dexTrades ?? []).map(mapSolanaRow).filter(Boolean) as BitqueryTransferRow[]
  }

  return rows
    .filter(row => row.amountUsdt >= minUsd)
    .map(row => ({
      amountUsd: row.amountUsdt,
      amountTokens: row.baseAmount,
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

