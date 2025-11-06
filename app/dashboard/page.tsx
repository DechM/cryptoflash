'use client'

import { useEffect, useState } from 'react'
import { Token } from '@/lib/types'
import { Navbar } from '@/components/Navbar'
import { TokenTable } from '@/components/TokenTable'
import { Heatmap } from '@/components/Heatmap'
import { AdvancedFilters, FilterState } from '@/components/AdvancedFilters'
import { exportToCSV } from '@/lib/utils'
import { useFeature } from '@/hooks/useFeature'
import { RefreshCw, Zap, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

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
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-2">
            KOTH Tracker
          </h1>
          <p className="text-sm md:text-base text-[#b8c5d6] leading-relaxed">
            Real-time tracking of Pump.fun tokens in bonding curve phase
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
        </motion.div>

        {/* Stats Cards */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-3 md:p-4 border border-[#00FFA3]/20 hover-lift hover-glow cursor-default"
          >
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">Total Tokens</div>
            <div className="text-xl md:text-2xl font-bold text-[#00FFA3] number-transition">{tokens.length}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-3 md:p-4 border border-[#00D1FF]/20 hover-lift hover-glow cursor-default"
          >
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">KOTH Ready</div>
            <div className="text-xl md:text-2xl font-bold text-[#00D1FF] number-transition">
              {tokens.filter(t => t.progress >= 95).length}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-3 md:p-4 border border-[#ffd700]/20 hover-lift hover-glow cursor-default"
          >
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">High Score (90+)</div>
            <div className="text-xl md:text-2xl font-bold text-[#ffd700] number-transition">
              {tokens.filter(t => t.score >= 90).length}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-3 md:p-4 border border-[#FF2E86]/20 hover-lift hover-glow cursor-default"
          >
            <div className="text-xs md:text-sm text-[#b8c5d6] mb-1">Total Whales</div>
            <div className="text-xl md:text-2xl font-bold text-[#FF2E86] number-transition">
              {tokens.reduce((sum, t) => sum + t.whaleCount, 0)}
            </div>
          </motion.div>
        </div>

        {/* Advanced Filters - Pro & Ultimate Only */}
        {isEnabled('filters.advanced') ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <AdvancedFilters onFilterChange={handleFilterChange} userTier={plan} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-card rounded-xl p-6 border border-[#ffd700]/30 text-center"
          >
            <p className="text-[#b8c5d6] mb-4">Advanced Filters are a Pro/Ultimate feature</p>
            <a
              href="/premium"
              className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-[#FF2E86] to-[#ff6b35] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Upgrade to Pro
            </a>
          </motion.div>
        )}

        {/* Heatmap */}
        {filteredTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Heatmap tokens={filteredTokens} />
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full"
          >
            <TokenTable tokens={filteredTokens} refreshInterval={refreshIntervalMs} />
          </motion.div>
        )}
      </main>
    </div>
  )
}

