import axios from 'axios'

import { getSignaturesForAddress, getTransactionBySignature } from './api/helius'
import { LAMPORTS_PER_SOL } from './utils'

const DEXSCREENER_TRENDING_URL = 'https://api.dexscreener.com/latest/dex/pairs/trending'
const DEXSCREENER_SOLANA_URL = 'https://api.dexscreener.com/latest/dex/pairs/solana'
const SOLANA_CHAIN_ID = 'solana'

export const MIN_WHALE_ALERT_USD = Number(process.env.WHALE_ALERT_MIN_USD || '10000')
export const MAX_WHALE_SIGNATURES = Number(process.env.WHALE_ALERT_SIGNATURE_LIMIT || '2')

interface DexScreenerVolumeStats {
  h24?: string | number | null
}

interface DexScreenerLiquidityStats {
  usd?: string | number | null
}

interface DexScreenerTxnStats {
  buys?: number | null
  sells?: number | null
  total?: number | null
}

interface DexScreenerPairTxns {
  h24?: DexScreenerTxnStats | null
}

export interface DexScreenerPair {
  pairAddress?: string | null
  chainId?: string | null
  baseToken?: {
    address?: string | null
    symbol?: string | null
    name?: string | null
  } | null
  priceUsd?: string | number | null
  liquidity?: DexScreenerLiquidityStats | null
  volume?: DexScreenerVolumeStats | null
  txns?: DexScreenerPairTxns | null
}

interface DexScreenerTrendingResponse {
  pairs?: DexScreenerPair[]
}

export interface TopTokenRecord {
  token_address: string
  token_symbol: string | null
  token_name: string | null
  price_usd: number | null
  liquidity_usd: number | null
  volume_24h_usd: number | null
  txns_24h: number | null
  updated_at: string
}

interface UiTokenAmount {
  uiAmount?: number | null
  uiAmountString?: string | null
  amount?: string | number | null
  decimals?: number | null
}

interface TokenBalanceEntry {
  accountIndex: number
  mint: string
  owner?: string | null
  uiTokenAmount?: UiTokenAmount | null
}

interface ParsedTransactionMessage {
  accountKeys?: Array<string | { pubkey?: string }>
}

interface ParsedTransaction {
  blockTime?: number
  meta?: {
    fee?: number
    preTokenBalances?: TokenBalanceEntry[]
    postTokenBalances?: TokenBalanceEntry[]
  }
  transaction?: {
    message?: ParsedTransactionMessage
  }
}

export interface TokenTransferInsight {
  amountTokens: number
  sender: string | null
  receiver: string | null
  senderLabel?: string | null
  receiverLabel?: string | null
  eventType: 'transfer' | 'mint' | 'burn'
  blockTime?: string | null
  fee?: number | null
  rawDiff?: {
    senders: Array<{ owner: string; amount: number }>
    receivers: Array<{ owner: string; amount: number }>
  }
}

const KNOWN_ADDRESS_LABELS: Record<string, string> = {}

export async function fetchTrendingSolanaPairs(limit = 60): Promise<DexScreenerPair[]> {
  let pairs: DexScreenerPair[] = []

  try {
    const response = await axios.get<DexScreenerTrendingResponse>(`${DEXSCREENER_TRENDING_URL}?limit=${Math.max(limit * 2, 100)}`, { timeout: 8000 })
    pairs = response.data?.pairs || []
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    console.warn(`[Whale] Failed to fetch DexScreener trending pairs (status: ${status ?? 'unknown'}) - falling back to Solana pairs`)
  }

  if (!pairs.length) {
    try {
      const fallbackResponse = await axios.get<DexScreenerTrendingResponse>(DEXSCREENER_SOLANA_URL, { timeout: 8000 })
      pairs = fallbackResponse.data?.pairs || []
    } catch (fallbackError) {
      const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      console.error('[Whale] Failed to fetch DexScreener solana pairs:', message)
      return []
    }
  }

  const solanaPairs = pairs.filter(pair => pair.chainId?.toLowerCase() === SOLANA_CHAIN_ID)
  return solanaPairs.slice(0, limit)
}

export function mapPairsToTopTokens(pairs: DexScreenerPair[]): TopTokenRecord[] {
  const tokens: TopTokenRecord[] = []
  const seen = new Set<string>()

  for (const pair of pairs) {
    const base = pair.baseToken || {}
    const address = base?.address || ''
    if (!address || seen.has(address)) {
      continue
    }
    seen.add(address)

    const price = pair.priceUsd !== undefined && pair.priceUsd !== null ? Number(pair.priceUsd) : null
    const liquidity = pair.liquidity?.usd !== undefined && pair.liquidity?.usd !== null ? Number(pair.liquidity.usd) : null
    const volume = pair.volume?.h24 !== undefined && pair.volume?.h24 !== null ? Number(pair.volume.h24) : null
    const txns = pair.txns?.h24?.total ?? null

    tokens.push({
      token_address: address,
      token_symbol: base?.symbol || null,
      token_name: base?.name || null,
      price_usd: price && Number.isFinite(price) ? price : null,
      liquidity_usd: liquidity && Number.isFinite(liquidity) ? liquidity : null,
      volume_24h_usd: volume && Number.isFinite(volume) ? volume : null,
      txns_24h: txns ?? null,
      updated_at: new Date().toISOString()
    })
  }

  return tokens
}

function parseUiAmount(value?: UiTokenAmount | null): number {
  if (!value) return 0
  if (typeof value.uiAmount === 'number' && !Number.isNaN(value.uiAmount)) {
    return value.uiAmount
  }
  if (value.uiAmountString) {
    const parsed = Number(value.uiAmountString)
    if (!Number.isNaN(parsed)) return parsed
  }
  if (value.amount !== undefined && value.decimals !== undefined && value.decimals !== null) {
    const amt = Number(value.amount)
    const decimals = Number(value.decimals)
    if (!Number.isNaN(amt) && !Number.isNaN(decimals) && decimals >= 0) {
      return amt / Math.pow(10, decimals)
    }
  }
  return 0
}

function getAccountOwner(
  accountKeys: Array<string | { pubkey?: string }> | undefined,
  index: number,
  fallbackOwner?: string
): string {
  const entry = accountKeys?.[index]
  if (!entry) {
    return fallbackOwner || 'Unknown'
  }
  if (typeof entry === 'string') return entry
  if (typeof entry === 'object') {
    return entry.pubkey || entry.toString?.() || fallbackOwner || 'Unknown'
  }
  return fallbackOwner || 'Unknown'
}

function labelAddress(address: string | null | undefined): string | null {
  if (!address) return null
  return KNOWN_ADDRESS_LABELS[address] || null
}

export function extractTokenTransfer(rawTx: ParsedTransaction | null, mintAddress: string): TokenTransferInsight | null {
  if (!rawTx) return null

  const meta = rawTx.meta
  const message = rawTx.transaction?.message
  if (!meta || !message) return null

  const accountKeys = message.accountKeys || []
  const balances = new Map<number, { owner: string; pre: number; post: number; decimals: number | null }>()

  const preBalances = meta.preTokenBalances || []
  const postBalances = meta.postTokenBalances || []

  for (const entry of preBalances) {
    if (!entry || entry.mint !== mintAddress) continue
    const index = entry.accountIndex
    const owner = entry.owner || getAccountOwner(accountKeys, index)
    const decimals = entry.uiTokenAmount?.decimals ?? null
    const pre = parseUiAmount(entry.uiTokenAmount)
    const record = balances.get(index) || { owner, pre: 0, post: 0, decimals }
    record.pre = pre
    record.decimals = decimals ?? record.decimals
    record.owner = owner || record.owner
    balances.set(index, record)
  }

  for (const entry of postBalances) {
    if (!entry || entry.mint !== mintAddress) continue
    const index = entry.accountIndex
    const owner = entry.owner || getAccountOwner(accountKeys, index)
    const decimals = entry.uiTokenAmount?.decimals ?? null
    const post = parseUiAmount(entry.uiTokenAmount)
    const record = balances.get(index) || { owner, pre: 0, post: 0, decimals }
    record.post = post
    record.decimals = decimals ?? record.decimals
    record.owner = owner || record.owner
    balances.set(index, record)
  }

  if (balances.size === 0) {
    return null
  }

  let totalIn = 0
  let totalOut = 0
  const receivers: Array<{ owner: string; amount: number }> = []
  const senders: Array<{ owner: string; amount: number }> = []

  balances.forEach((record) => {
    const diff = (record.post ?? 0) - (record.pre ?? 0)
    if (Math.abs(diff) < 1e-9) return
    if (diff > 0) {
      totalIn += diff
      receivers.push({ owner: record.owner, amount: diff })
    } else {
      const out = Math.abs(diff)
      totalOut += out
      senders.push({ owner: record.owner, amount: out })
    }
  })

  if (totalIn <= 0 && totalOut <= 0) {
    return null
  }

  const primaryReceiver = receivers.sort((a, b) => b.amount - a.amount)[0] || null
  const primarySender = senders.sort((a, b) => b.amount - a.amount)[0] || null

  const eventType: 'transfer' | 'mint' | 'burn' =
    totalOut === 0 && totalIn > 0 ? 'mint' : totalIn === 0 && totalOut > 0 ? 'burn' : 'transfer'

  const blockTime = rawTx.blockTime ? new Date(rawTx.blockTime * 1000).toISOString() : null
  const feeLamports = meta.fee ?? null
  const feeSol = feeLamports !== null ? feeLamports / LAMPORTS_PER_SOL : null

  return {
    amountTokens: eventType === 'burn' ? totalOut : totalIn,
    sender: primarySender?.owner || null,
    receiver: primaryReceiver?.owner || null,
    senderLabel: labelAddress(primarySender?.owner),
    receiverLabel: labelAddress(primaryReceiver?.owner),
    eventType,
    blockTime,
    fee: feeSol,
    rawDiff: {
      senders,
      receivers
    }
  }
}

interface WhaleDetectionResult {
  event: {
    token_address: string
    token_symbol: string | null
    token_name: string | null
    event_type: 'transfer' | 'mint' | 'burn'
    amount_tokens: number
    amount_usd: number
    price_usd: number | null
    liquidity_usd: number | null
    volume_24h_usd: number | null
    sender: string | null
    sender_label: string | null
    receiver: string | null
    receiver_label: string | null
    tx_hash: string
    tx_url: string
    event_data: TokenTransferInsight['rawDiff']
    block_time: string | null
    fee: number | null
  }
  signature: string
}

export async function detectWhaleTransfersForToken(
  token: TopTokenRecord,
  options: { minUsd?: number; maxSignatures?: number } = {}
): Promise<WhaleDetectionResult[]> {
  const minUsd = options.minUsd ?? MIN_WHALE_ALERT_USD
  const maxSignatures = options.maxSignatures ?? MAX_WHALE_SIGNATURES
  const results: WhaleDetectionResult[] = []

  if (!token.token_address) {
    return results
  }

  const signatures = await getSignaturesForAddress(token.token_address, maxSignatures)
  if (!signatures || signatures.length === 0) {
    return results
  }

  for (const sig of signatures) {
    const signature = typeof sig === 'string' ? sig : sig.signature
    if (!signature) continue

    const tx = (await getTransactionBySignature(signature)) as ParsedTransaction | null
    if (!tx) continue

    const transfer = extractTokenTransfer(tx, token.token_address)
    if (!transfer || transfer.amountTokens <= 0) {
      continue
    }

    const price = token.price_usd || 0
    const amountUsd = price * transfer.amountTokens
    if (!price || !Number.isFinite(amountUsd) || amountUsd < minUsd) {
      continue
    }

    results.push({
      signature,
      event: {
        token_address: token.token_address,
        token_symbol: token.token_symbol,
        token_name: token.token_name,
        event_type: transfer.eventType,
        amount_tokens: transfer.amountTokens,
        amount_usd: amountUsd,
        price_usd: token.price_usd,
        liquidity_usd: token.liquidity_usd,
        volume_24h_usd: token.volume_24h_usd,
        sender: transfer.sender,
        sender_label: transfer.senderLabel || null,
        receiver: transfer.receiver,
        receiver_label: transfer.receiverLabel || null,
        tx_hash: signature,
        tx_url: `https://solscan.io/tx/${signature}`,
        event_data: transfer.rawDiff,
        block_time: transfer.blockTime || (tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null),
        fee: transfer.fee ?? null
      }
    })
  }

  return results
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
