'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  ExternalLink,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Wallet,
  X
} from 'lucide-react'

import { Navbar } from '@/components/Navbar'
import { WhaleEvent } from '@/lib/types'
import { cn, copyToClipboard, formatAddress, formatNumber } from '@/lib/utils'

const REFRESH_INTERVAL = Number(process.env.NEXT_PUBLIC_WHALE_REFRESH_MS || 60000)
const MIN_WHALE_THRESHOLD = Number(process.env.NEXT_PUBLIC_WHALE_MIN_USD || process.env.WHALE_ALERT_MIN_USD || '10000')

type FeedFilter = 'all' | 'transfer' | 'mint' | 'burn'
type TimeFilter = '1h' | '6h' | '24h' | 'all'

const FILTER_LABELS: Record<FeedFilter, string> = {
  all: 'All Events',
  transfer: 'Large Transfers',
  mint: 'Newly Minted',
  burn: 'Burned Supply'
}

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  '1h': 'Last 1h',
  '6h': 'Last 6h',
  '24h': 'Last 24h',
  all: 'All Time'
}

const EVENT_BADGES: Record<string, { label: string; color: string }> = {
  transfer: { label: 'Transfer', color: 'bg-[#1D9BF0]/20 text-[#60A5FA]' },
  mint: { label: 'Mint', color: 'bg-[#22c55e]/20 text-[#22c55e]' },
  burn: { label: 'Burn', color: 'bg-[#f97316]/20 text-[#f97316]' },
  exchange: { label: 'Exchange', color: 'bg-[#facc15]/20 text-[#facc15]' }
}

const AMOUNT_BADGES = [
  { threshold: 500000, label: 'MEGA 🐳', color: 'border-[#f472b6]/40 text-[#f472b6]' },
  { threshold: 250000, label: 'GIGA 🐳', color: 'border-[#38bdf8]/40 text-[#38bdf8]' },
  { threshold: 100000, label: 'SUPER 🐳', color: 'border-[#34d399]/40 text-[#34d399]' },
  { threshold: 50000, label: 'HUGE 🐳', color: 'border-[#facc15]/40 text-[#facc15]' },
  { threshold: 10000, label: 'LARGE 🐳', color: 'border-[#c084fc]/40 text-[#c084fc]' }
]

function getAmountBadge(amountUsd: number | null | undefined) {
  if (!amountUsd) return null
  for (const badge of AMOUNT_BADGES) {
    if (amountUsd >= badge.threshold) {
      return badge
    }
  }
  return null
}

function formatUsd(value?: number | null, decimals = 0) {
  if (!value || !isFinite(value)) return '—'
  if (value >= 1_000_000) {
    return `$${formatNumber(value, 2)}`
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: decimals === 0 ? 0 : decimals, minimumFractionDigits: decimals })}`
}

function formatTokenAmount(value?: number | null) {
  if (!value || !isFinite(value)) return '—'
  if (value >= 1_000_000) {
    return `${formatNumber(value, 2)} tokens`
  }
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
}

async function safeCopy(value: string) {
  try {
    await copyToClipboard(value)
  } catch (error: unknown) {
    console.warn('Clipboard copy failed', error)
  }
}

export default function WhaleAlertsPage() {
  const [events, setEvents] = useState<WhaleEvent[]>([])
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<WhaleEvent | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchEvents = async (selectedFilter: FeedFilter = filter) => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({ limit: '60' })
      if (selectedFilter !== 'all') {
        params.set('type', selectedFilter)
      }
      const response = await fetch(`/api/whales?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch whale events (${response.status})`)
      }

      const data = await response.json()
      setEvents(data.events || [])
      setError(null)
      setLastUpdated(new Date())
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Whale Feed] Fetch error:', err)
      setError(message || 'Failed to load whale events')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEvents(filter)
    const interval = setInterval(() => fetchEvents(filter), REFRESH_INTERVAL)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const filteredEvents = useMemo(() => {
    if (!events?.length) return []

    const now = Date.now()
    const horizonMs: Record<Exclude<TimeFilter, 'all'>, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    }

    return events.filter(event => {
      if (timeFilter === 'all') return true
      if (!event.block_time) return true
      const blockTs = new Date(event.block_time).getTime()
      if (Number.isNaN(blockTs)) return true
      return now - blockTs <= horizonMs[timeFilter]
    })
  }, [events, timeFilter])

  const summary = useMemo(() => {
    if (!events?.length) {
      return {
        count: 0,
        volumeUsd: 0,
        largestUsd: 0,
        uniqueTokens: 0
      }
    }

    const volumeUsd = events.reduce((acc, event) => acc + (event.amount_usd ?? 0), 0)
    const largestUsd = events.reduce((max, event) => Math.max(max, event.amount_usd ?? 0), 0)
    const uniqueTokens = new Set(events.map(event => event.token_address)).size

    return {
      count: events.length,
      volumeUsd,
      largestUsd,
      uniqueTokens
    }
  }, [events])

  return (
    <div className="min-h-screen bg-[#050712] w-full flex flex-col">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-12 py-10 flex-grow">
        <div className="max-w-7xl mx-auto space-y-10">
          <header className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold gradient-text">Whale Alerts</h1>
                  <p className="text-[#94A3B8] text-sm md:text-base">
                    Live tracker for high-value movements across the top Solana tokens. Powered by DexScreener + Helius.
                  </p>
                </div>
                <div className="glass-card px-4 py-3 rounded-xl text-right">
                  <p className="text-xs text-[#6b7280] uppercase tracking-widest">Threshold</p>
                  <p className="text-sm md:text-lg text-[#F8FAFC] font-semibold">{formatUsd(MIN_WHALE_THRESHOLD, 0)}+</p>
                  <p className="text-xs text-[#6b7280]">USD per transfer</p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center gap-3">
              {(Object.keys(FILTER_LABELS) as FeedFilter[]).map(option => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-transparent',
                    filter === option
                      ? 'bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black shadow-[0_0_18px_rgba(0,255,163,0.45)]'
                      : 'glass-card text-[#b8c5d6] hover:text-white hover:border-white/10'
                  )}
                >
                  {FILTER_LABELS[option]}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-3 text-xs text-[#6b7280]">
                {lastUpdated && (
                  <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
                )}
                <button
                  onClick={() => fetchEvents(filter)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors',
                    refreshing
                      ? 'border-[#00D1FF]/60 text-[#00D1FF]'
                      : 'border-white/10 text-[#b8c5d6] hover:text-white hover:border-white/30'
                  )}
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                  <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map(option => (
                <button
                  key={option}
                  onClick={() => setTimeFilter(option)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border border-transparent',
                    timeFilter === option
                      ? 'bg-white/10 text-white border-white/20 shadow-[0_0_12px_rgba(0,209,255,0.35)]'
                      : 'text-[#8091a7] hover:text-white hover:border-white/10'
                  )}
                >
                  {TIME_FILTER_LABELS[option]}
                </button>
              ))}
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-[#64748b]">Total Alerts</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.count}</p>
              <p className="text-xs text-[#6b7280]">Loaded in the current session</p>
            </div>
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-[#64748b]">Aggregated Volume</p>
              <p className="mt-2 text-2xl font-bold text-[#00FFA3]">{summary.volumeUsd ? formatUsd(summary.volumeUsd) : '$0'}</p>
              <p className="text-xs text-[#6b7280]">Across all displayed alerts</p>
            </div>
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-[#64748b]">Largest Whale</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.largestUsd ? formatUsd(summary.largestUsd) : '$0'}</p>
              <p className="text-xs text-[#6b7280]">Biggest single transfer</p>
            </div>
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-[#64748b]">Unique Tokens</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.uniqueTokens}</p>
              <p className="text-xs text-[#6b7280]">Represented in this feed</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-6 animate-pulse">
                  <div className="h-4 w-24 bg-white/10 rounded-full mb-4" />
                  <div className="h-8 w-32 bg-white/10 rounded-lg mb-6" />
                  <div className="h-4 w-full bg-white/10 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <ShieldAlert className="h-10 w-10 mx-auto text-[#f97316] mb-4" />
              <p className="text-[#fca5a5] font-semibold">{error}</p>
              <p className="text-[#94A3B8] text-sm mt-2">
                Retry in a few seconds or adjust your Helius rate limit. The feed gracefully degrades if the API is unavailable.
              </p>
              <button
                onClick={() => fetchEvents(filter)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black font-semibold hover:opacity-90"
              >
                Retry
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-[#00D1FF] mb-4" />
              <h3 className="text-xl font-semibold text-white">No whale events yet</h3>
              <p className="text-[#94A3B8] mt-2">We scan the top DexScreener tokens every 15 minutes. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map(event => (
                <motion.button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card w-full text-left rounded-2xl p-5 hover:border-[#00D1FF]/40 transition-all duration-200 focus:outline-none"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1f2937] to-[#0f172a] flex items-center justify-center text-xl">🐳</div>
                      <div>
                        <p className="text-sm text-[#6b7280]">
                          {event.block_time ? formatDistanceToNow(new Date(event.block_time), { addSuffix: true }) : 'Just now'}
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                          {event.token_symbol || formatAddress(event.token_address, 6)}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#00FFA3]">
                        {formatUsd(event.amount_usd ?? null)}
                      </p>
                      <p className="text-sm text-[#94A3B8]">{formatTokenAmount(event.amount_tokens ?? null)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {(() => {
                      const badge = EVENT_BADGES[event.event_type] || EVENT_BADGES.transfer
                      return (
                        <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold', badge.color)}>
                          <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                          {badge.label}
                        </span>
                      )
                    })()}
                    {(() => {
                      const badge = getAmountBadge(event.amount_usd ?? null)
                      if (!badge) return null
                      return (
                        <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold', badge.color)}>
                          {badge.label}
                        </span>
                      )
                    })()}
                  </div>

                  <div className="space-y-3 text-sm text-[#b8c5d6]">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[#00D1FF]" />
                      <span className="truncate">{event.sender ? formatAddress(event.sender, 6) : 'Unknown source'}</span>
                      <ArrowRight className="h-4 w-4 text-[#6b7280]" />
                      <span className="truncate">{event.receiver ? formatAddress(event.receiver, 6) : 'Unknown destination'}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6b7280]">
                      <span>Price: {formatUsd(event.price_usd ?? null, 4)}</span>
                      <span>Liquidity: {formatUsd(event.liquidity_usd ?? null)}</span>
                      <span>24h Vol: {formatUsd(event.volume_24h_usd ?? null)}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 130, damping: 18 }}
              className="relative max-w-3xl w-full glass-card rounded-3xl border border-white/10 p-6 md:p-8"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#6b7280] uppercase tracking-[0.35em] mb-2">Whale Alert</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {selectedEvent.token_name || selectedEvent.token_symbol || formatAddress(selectedEvent.token_address, 6)}
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      Detected {selectedEvent.block_time ? formatDistanceToNow(new Date(selectedEvent.block_time), { addSuffix: true }) : 'just now'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-[#6b7280] uppercase tracking-widest">Value</p>
                    <p className="text-3xl font-bold text-[#00FFA3]">{formatUsd(selectedEvent.amount_usd ?? null)}</p>
                    <p className="text-sm text-[#94A3B8]">{formatTokenAmount(selectedEvent.amount_tokens ?? null)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white">Movement</h3>
                    <div className="flex items-center gap-3 text-sm text-[#b8c5d6]">
                      <Wallet className="h-4 w-4 text-[#00D1FF]" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-widest text-[#6b7280]">From</span>
                          <button
                            className="text-xs text-[#00D1FF] hover:text-white"
                            onClick={() => selectedEvent.sender && safeCopy(selectedEvent.sender)}
                          >
                            Copy
                          </button>
                        </div>
                        <p className="font-mono text-sm break-all text-white/90">
                          {selectedEvent.sender || 'Unknown'}
                        </p>
                        {selectedEvent.sender_label && (
                          <p className="text-xs text-[#94A3B8]">{selectedEvent.sender_label}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#b8c5d6]">
                      <Wallet className="h-4 w-4 text-[#34d399]" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-widest text-[#6b7280]">To</span>
                          <button
                            className="text-xs text-[#34d399] hover:text-white"
                            onClick={() => selectedEvent.receiver && safeCopy(selectedEvent.receiver)}
                          >
                            Copy
                          </button>
                        </div>
                        <p className="font-mono text-sm break-all text-white/90">
                          {selectedEvent.receiver || 'Unknown'}
                        </p>
                        {selectedEvent.receiver_label && (
                          <p className="text-xs text-[#94A3B8]">{selectedEvent.receiver_label}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 text-sm text-[#b8c5d6]">
                    <h3 className="text-sm font-semibold text-white">Market Snapshot</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Token Price</span>
                      <span className="text-white">{formatUsd(selectedEvent.price_usd ?? null, 6)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Liquidity</span>
                      <span className="text-white">{formatUsd(selectedEvent.liquidity_usd ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">24h Volume</span>
                      <span className="text-white">{formatUsd(selectedEvent.volume_24h_usd ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Network Fee</span>
                      <span className="text-white">{selectedEvent.fee ? `${selectedEvent.fee.toFixed(6)} SOL` : '—'}</span>
                    </div>
                  </div>
                </div>

                {selectedEvent.event_data && (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white">Breakdown</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-[#b8c5d6]">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-2">Senders</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(selectedEvent.event_data?.senders ?? []).map((sender, idx) => (
                            <div key={`sender-${idx}`} className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs break-all">{sender.owner}</span>
                              <span className="text-xs text-[#94A3B8]">{formatTokenAmount(sender.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-2">Receivers</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(selectedEvent.event_data?.receivers ?? []).map((receiver, idx) => (
                            <div key={`receiver-${idx}`} className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs break-all">{receiver.owner}</span>
                              <span className="text-xs text-[#94A3B8]">{formatTokenAmount(receiver.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#6b7280] space-y-1">
                    <p>Signature</p>
                    <p className="font-mono text-sm text-white/90 break-all">{selectedEvent.tx_hash}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => safeCopy(selectedEvent.tx_hash)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-sm text-[#b8c5d6] hover:text-white hover:border-white/30 transition-colors"
                    >
                      Copy TX
                    </button>
                    <a
                      href={selectedEvent.tx_url || `https://solscan.io/tx/${selectedEvent.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black text-sm font-semibold hover:opacity-90"
                    >
                      View on Solscan
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
