import axios from 'axios'

import { LAMPORTS_PER_SOL } from '@/lib/utils'
import { isValidSolanaAddress, sanitizeSolanaAddress } from '@/lib/solana'

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || ''
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const HELIUS_DAS_BASE = `https://api.helius.xyz/v0/addresses`

export const HELIUS_API_AVAILABLE = !!HELIUS_API_KEY

const MAX_RETRIES = Number(process.env.HELIUS_MAX_RETRIES || '3')
const RETRY_DELAY_MS = Number(process.env.HELIUS_RETRY_DELAY_MS || '800')

function hasResponseStatus(error: unknown, status: number): boolean {
  if (typeof error !== 'object' || error === null) return false
  if (!('response' in error)) return false
  const resp = (error as { response?: { status?: number } }).response
  return typeof resp?.status === 'number' && resp.status === status
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const code = (error as { code?: string }).code
  return code === 'ECONNABORTED' || error.message?.includes('timeout')
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function postWithRetry<T>(url: string, payload: unknown, timeout = 10000, context?: Record<string, unknown>): Promise<T | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post<T>(url, payload, { timeout })
      return response.data
    } catch (error: unknown) {
      if (hasResponseStatus(error, 429)) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
      if (isTimeoutError(error)) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const body = error.response?.data
        console.warn('[Helius] request failed:', {
          status,
          body,
          context
        })
      } else {
        const message = error instanceof Error ? error.message : String(error)
        console.warn('[Helius] request failed:', message, context)
      }
      return null
    }
  }
  return null
}

export async function getSignaturesForAddress(address: string, limit: number = 5): Promise<Array<{ signature: string; blockTime?: number }>> {
  if (!HELIUS_API_KEY) return []

  const normalized = sanitizeSolanaAddress(address)
  if (!normalized) {
    console.warn('[Helius] getSignaturesForAddress called with invalid address:', address)
    return []
  }

  const payload = {
    jsonrpc: '2.0',
    id: 'getSignaturesForAddress',
    method: 'getSignaturesForAddress',
    params: [normalized, { limit }]
  }

  const data = await postWithRetry<{ result?: Array<{ signature: string; blockTime?: number }> }>(HELIUS_RPC_URL, payload, 8000, { original: address, normalized, action: 'getSignaturesForAddress' })
  if (!data?.result) return []
  return data.result
}

export async function getTransactionBySignature(signature: string): Promise<any | null> {
  if (!HELIUS_API_KEY) return null

  const payload = {
    jsonrpc: '2.0',
    id: `getTransaction-${signature.substring(0, 12)}`,
    method: 'getTransaction',
    params: [
      signature,
      { maxSupportedTransactionVersion: 0 }
    ]
  }

  const data = await postWithRetry<{ result?: any }>(HELIUS_RPC_URL, payload, 10000, { signature, action: 'getTransactionBySignature' })
  return data?.result || null
}

export interface HeliusDasTokenAmount {
  amount?: string
  decimals?: number
  uiAmount?: number
  uiAmountString?: string
}

export interface HeliusDasTokenTransfer {
  mint: string
  fromUserAccount?: string | null
  toUserAccount?: string | null
  tokenAmount?: HeliusDasTokenAmount | null
  type?: string | null
}

export interface HeliusDasTransaction {
  signature: string
  timestamp?: number
  fee?: number
  tokenTransfers?: HeliusDasTokenTransfer[]
}

function parseTokenTransferAmount(transfer?: HeliusDasTokenTransfer | null): number {
  if (!transfer?.tokenAmount) return 0
  const amt = transfer.tokenAmount
  if (typeof amt.uiAmount === 'number' && !Number.isNaN(amt.uiAmount)) return amt.uiAmount
  if (amt.uiAmountString) {
    const parsed = Number(amt.uiAmountString)
    if (!Number.isNaN(parsed)) return parsed
  }
  if (amt.amount !== undefined && amt.decimals !== undefined) {
    const raw = Number(amt.amount)
    if (!Number.isNaN(raw) && typeof amt.decimals === 'number') {
      return raw / Math.pow(10, amt.decimals)
    }
  }
  return 0
}

function mapTransferType(type?: string | null): 'transfer' | 'mint' | 'burn' {
  switch (type?.toUpperCase()) {
    case 'MINT':
      return 'mint'
    case 'BURN':
      return 'burn'
    default:
      return 'transfer'
  }
}

export async function fetchTransactionsForAddress(address: string, limit: number = 5): Promise<HeliusDasTransaction[]> {
  if (!HELIUS_API_KEY) return []

  const normalized = sanitizeSolanaAddress(address)
  if (!normalized || !isValidSolanaAddress(normalized)) {
    console.warn('[Helius] fetchTransactionsForAddress skipping invalid address:', address)
    return []
  }

  const url = `${HELIUS_DAS_BASE}/transactions?api-key=${HELIUS_API_KEY}`
  const payload = {
    addresses: [normalized],
    limit,
    commitment: 'finalized',
  }

  const data = await postWithRetry<HeliusDasTransaction[] | { transactions?: HeliusDasTransaction[] }>(url, payload, 15000, { original: address, normalized, action: 'fetchTransactionsForAddress', limit })
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.transactions)) return data.transactions
  return []
}

export async function fetchWhaleTransactions(
  tokenAddress: string,
  options: { limit?: number; priceUsd?: number | null; minUsd?: number } = {}
): Promise<{ whaleCount: number; whaleInflows: number; totalVolume: number }> {
  const limit = options.limit ?? 5
  const priceUsd = typeof options.priceUsd === 'number' ? options.priceUsd : 0
  const minUsd = typeof options.minUsd === 'number' ? options.minUsd : 0

  const transactions = await fetchTransactionsForAddress(tokenAddress, limit)
  if (!transactions.length) {
    return { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
  }

  let whaleCount = 0
  let whaleInflows = 0
  let totalVolume = 0

  for (const tx of transactions) {
    const transfers = tx.tokenTransfers?.filter(t => t.mint === tokenAddress) ?? []
    for (const transfer of transfers) {
      const amountTokens = parseTokenTransferAmount(transfer)
      if (!amountTokens) continue

      const usdValue = priceUsd ? amountTokens * priceUsd : 0
      totalVolume += usdValue

      if (minUsd && usdValue < minUsd) continue

      whaleCount += 1
      whaleInflows += usdValue
    }
  }

  return { whaleCount, whaleInflows, totalVolume }
}

export function toWhaleEvent(
  tokenAddress: string,
  tokenSymbol: string | null,
  tokenName: string | null,
  priceUsd: number | null,
  tx: HeliusDasTransaction,
  transfer: HeliusDasTokenTransfer
) {
  const amountTokens = parseTokenTransferAmount(transfer)
  const amountUsd = priceUsd ? amountTokens * priceUsd : 0
  const fee = typeof tx.fee === 'number' ? tx.fee / LAMPORTS_PER_SOL : null
  const blockTime = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : null

  const eventData = {
    senders: transfer.fromUserAccount
      ? [{ owner: transfer.fromUserAccount, amount: amountTokens }]
      : [],
    receivers: transfer.toUserAccount
      ? [{ owner: transfer.toUserAccount, amount: amountTokens }]
      : []
  }

  return {
    signature: tx.signature,
    event: {
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      token_name: tokenName,
      event_type: mapTransferType(transfer.type),
      amount_tokens: amountTokens,
      amount_usd: amountUsd ?? 0,
      price_usd: priceUsd,
      liquidity_usd: null,
      volume_24h_usd: null,
      sender: transfer.fromUserAccount || null,
      sender_label: null,
      receiver: transfer.toUserAccount || null,
      receiver_label: null,
      tx_hash: tx.signature,
      tx_url: `https://solscan.io/tx/${tx.signature}`,
      event_data: eventData,
      block_time: blockTime,
      fee,
    }
  }
}

export async function calculateRugRisk(_tokenAddress: string): Promise<number> {
  return 50
}
