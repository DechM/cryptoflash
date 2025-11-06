'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void
  userTier: 'free' | 'pro' | 'ultimate' | string
}

export interface FilterState {
  scoreMin?: number
  scoreMax?: number
  volumeMin?: number
  whaleOnly?: boolean
  progressMin?: number
  progressMax?: number
}

export function AdvancedFilters({ onFilterChange, userTier }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})

  if (userTier !== 'pro' && userTier !== 'ultimate') {
    return (
      <div className="glass rounded-xl p-6 border border-[#ffd700]/30">
        <div className="flex items-center space-x-3 mb-3">
          <Filter className="h-5 w-5 text-[#ffd700]" />
          <h3 className="font-semibold text-white">Advanced Filters</h3>
        </div>
        <p className="text-sm text-[#b8c5d6] mb-4">
          🔒 Advanced Filters are a Pro/Ultimate feature
        </p>
        <a
          href="/premium"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-[#FF2E86] to-[#ff6b35] text-white font-semibold text-sm md:text-base hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-[#FF2E86]/20 hover:shadow-[#FF2E86]/40 min-h-[44px]"
        >
          Upgrade to Pro
        </a>
      </div>
    )
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterState = {}
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <div className="glass rounded-xl p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-[#00FFA3]" />
          <span className="font-semibold text-white">Advanced Filters</span>
        </div>
        {Object.keys(filters).length > 0 && (
          <span className="px-2 py-1 rounded-full bg-[#00FFA3]/20 text-[#00FFA3] text-xs font-semibold">
            {Object.keys(filters).length} active
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                  Score Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="100"
                    value={filters.scoreMin || ''}
                    onChange={(e) => handleFilterChange('scoreMin', e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white"
                  />
                  <span className="text-[#6b7280]">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    max="100"
                    value={filters.scoreMax || ''}
                    onChange={(e) => handleFilterChange('scoreMax', e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                  Progress Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min %"
                    min="0"
                    max="100"
                    value={filters.progressMin || ''}
                    onChange={(e) => handleFilterChange('progressMin', e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white"
                  />
                  <span className="text-[#6b7280]">-</span>
                  <input
                    type="number"
                    placeholder="Max %"
                    min="0"
                    max="100"
                    value={filters.progressMax || ''}
                    onChange={(e) => handleFilterChange('progressMax', e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                  Minimum Volume 24h ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={filters.volumeMin || ''}
                  onChange={(e) => handleFilterChange('volumeMin', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.whaleOnly || false}
                    onChange={(e) => handleFilterChange('whaleOnly', e.target.checked)}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-[#00FFA3] focus:ring-[#00FFA3]"
                  />
                  <span className="text-sm font-semibold text-[#b8c5d6]">
                    Only tokens with whale activity (3+ whales)
                  </span>
                </label>
              </div>
            </div>

            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#FF2E86]/20 text-[#FF2E86] hover:bg-[#FF2E86]/30 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

