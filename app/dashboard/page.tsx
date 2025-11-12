'use client'

import { useEffect, useState } from 'react'
import { Token } from '@/lib/types'
import { Navbar } from '@/components/Navbar'
import { AdvancedFilters, FilterState } from '@/components/AdvancedFilters'
import { exportToCSV } from '@/lib/utils'
import { useFeature } from '@/hooks/useFeature'
import { RefreshCw, Zap, Download } from 'lucide-react'
import useSWR from 'swr'
import Script from 'next/script'
import dynamic from 'next/dynamic'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function HeatmapSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="h-6 w-40 bg-white/10 rounded mb-4 animate-pulse" />
      <div className="h-72 w-full rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 md:p-8">
      <div className="h-6 w-48 bg-white/10 rounded mb-6 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

const Heatmap = dynamic(
  () => import('@/components/Heatmap').then(mod => mod.Heatmap),
  { ssr: false, loading: () => <HeatmapSkeleton /> }
)

const TokenTable = dynamic(
  () => import('@/components/TokenTable').then(mod => mod.TokenTable),
  { ssr: false, loading: () => <TableSkeleton /> }
)

export default function DashboardPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const { plan, limit, isEnabled } = useFeature()
  const refreshIntervalMs = limit('refresh.ms') as number

  const fetchKOTHData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/koth-data')
      const data = await response.json()
      if (data.tokens) {
        setTokens(data.tokens)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching KOTH data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data with SWR for auto-refresh based on plan
  const { data: kothData } = useSWR('/api/koth-data', fetcher, {
    refreshInterval: refreshIntervalMs,
    onSuccess: (data) => {
      if (data.tokens) {
        setTokens(data.tokens)
        setLastUpdate(new Date())
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    fetchKOTHData()
  }, [])

  useEffect(() => {
    // Set up polling based on plan refresh interval
    const interval = setInterval(fetchKOTHData, refreshIntervalMs)
    return () => clearInterval(interval)
  }, [refreshIntervalMs])

  // Apply filters
  useEffect(() => {
    setFilteredTokens(tokens)
  }, [tokens])

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...tokens]

    if (filters.scoreMin !== undefined) {
      filtered = filtered.filter(t => t.score >= filters.scoreMin!)
    }
    if (filters.scoreMax !== undefined) {
      filtered = filtered.filter(t => t.score <= filters.scoreMax!)
    }
    if (filters.progressMin !== undefined) {
      filtered = filtered.filter(t => t.progress >= filters.progressMin!)
    }
    if (filters.progressMax !== undefined) {
      filtered = filtered.filter(t => t.progress <= filters.progressMax!)
    }
    if (filters.volumeMin !== undefined) {
      filtered = filtered.filter(t => (t.volume24h || 0) >= filters.volumeMin!)
    }
    if (filters.whaleOnly) {
      filtered = filtered.filter(t => t.whaleCount >= 3)
    }

    setFilteredTokens(filtered)
  }

  const handleExport = () => {
    const exportData = filteredTokens.map(t => ({
      Rank: filteredTokens.indexOf(t) + 1,
      Name: t.name,
      Symbol: t.symbol,
      'Contract Address': t.tokenAddress,
      'Progress %': t.progress.toFixed(1),
      Score: t.score.toFixed(1),
      Whales: t.whaleCount,
      'Volume 24h': t.volume24h ? `$${t.volume24h.toFixed(2)}` : 'N/A',
      'Price USD': t.priceUsd ? `$${t.priceUsd.toFixed(6)}` : 'N/A'
    }))
    exportToCSV(exportData, `koth-tokens-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <>
      {/* SEO Structured Data for Dashboard */}
      <Script
        id="dashboard-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Live KOTH Dashboard - Real-time Solana Curve Tracker",
            "description": "Live dashboard tracking Solana KOTH candidates in real-time. See bonding-curve progress, AI Snipe Scores, whale activity and volume before liquidity unlocks.",
            "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}/dashboard`,
            "mainEntity": {
              "@type": "DataCatalog",
              "name": "KOTH Signal Catalog",
              "description": "Real-time tracking of Solana bonding-curve tokens approaching KOTH"
            }
          })
        }}
      />
      <div className="min-h-screen bg-[#0B1020] w-full">
        <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-2">
            KOTH Tracker
          </h1>
          <p className="text-sm md:text-base text-[#b8c5d6] leading-relaxed">
            Real-time telemetry for Solana bonding-curve launches. Monitor progress, scores and liquidity to anticipate the next KOTH unlock.
          </p>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 mt-4">
            {isEnabled('analytics.premium') && (
              <button
                onClick={handleExport}
                className="btn-secondary flex items-center space-x-2 text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 min-h-[44px]"
                title="Export to CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button
              onClick={fetchKOTHData}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${loading ? 'animate-spin' : 'hover:rotate-180'}`} />
              <span>Refresh</span>
            </button>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-[#6b7280]">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="glass-card rounded-xl p-3 md:p-4 border border-[#00FFA3]/20 hover-lift hover-glow cursor-default">
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">Total Tokens</div>
            <div className="text-xl md:text-2xl font-bold text-[#00FFA3] number-transition">{tokens.length}</div>
          </div>
          
          <div className="glass-card rounded-xl p-3 md:p-4 border border-[#00D1FF]/20 hover-lift hover-glow cursor-default">
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">KOTH Ready</div>
            <div className="text-xl md:text-2xl font-bold text-[#00D1FF] number-transition">
              {tokens.filter(t => t.progress >= 95).length}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-3 md:p-4 border border-[#ffd700]/20 hover-lift hover-glow cursor-default">
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">High Score (90+)</div>
            <div className="text-xl md:text-2xl font-bold text-[#ffd700] number-transition">
              {tokens.filter(t => t.score >= 90).length}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-3 md:p-4 border border-[#FF2E86]/20 hover-lift hover-glow cursor-default">
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">Total Whales</div>
            <div className="text-xl md:text-2xl font-bold text-[#FF2E86] number-transition">
              {tokens.reduce((sum, t) => sum + t.whaleCount, 0)}
            </div>
          </div>
        </div>

        {/* Advanced Filters - Pro & Ultimate Only */}
        {isEnabled('filters.advanced') ? (
          <div className="mb-8">
            <AdvancedFilters onFilterChange={handleFilterChange} userTier={plan} />
          </div>
        ) : (
          <div className="mb-8 glass-card rounded-xl p-6 border border-[#ffd700]/30 text-center">
            <p className="text-[#b8c5d6] mb-4">Advanced Filters are a Pro/Ultimate feature</p>
            <a
              href="/premium"
              className="btn-cta-upgrade inline-block"
            >
              Upgrade to Pro
            </a>
          </div>
        )}

        {/* Heatmap */}
        {filteredTokens.length > 0 && (
          <div className="mb-8">
            <Heatmap tokens={filteredTokens} />
          </div>
        )}

        {/* Token Table - Full Width */}
        {loading && tokens.length === 0 ? (
          <div className="w-full glass-card rounded-xl p-12 text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-[#00FFA3]" />
            <p className="text-[#b8c5d6]">Loading KOTH data...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="w-full glass-card rounded-xl p-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-[#6b7280]" />
            <p className="text-[#b8c5d6]">No KOTH tokens found</p>
          </div>
        ) : (
          <div className="w-full">
            <TokenTable tokens={filteredTokens} refreshInterval={refreshIntervalMs} />
          </div>
        )}
      </main>
    </div>
    </>
  )
}

