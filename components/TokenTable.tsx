'use client'

import { Token } from '@/lib/types'
import { getScoreColor, getScoreBgColor } from '@/lib/score'
import { formatAddress, formatNumber, copyToClipboard, getPumpFunUrl } from '@/lib/utils'
import { Copy, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface TokenTableProps {
  tokens: Token[]
  refreshInterval?: number
}

export function TokenTable({ tokens, refreshInterval = 60000 }: TokenTableProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const handleCopy = async (address: string) => {
    await copyToClipboard(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <div className="w-full glass-card rounded-xl p-4 md:p-6 overflow-x-auto">
      <div className="min-w-full">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Rank</th>
              <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Token</th>
              <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6] hidden sm:table-cell">CA</th>
              <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Progress</th>
              <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Score</th>
              <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6] hidden md:table-cell">Whales</th>
              <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6] hidden lg:table-cell">Volume 24h</th>
              <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <motion.tr
                key={token.tokenAddress}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 hover-lift"
              >
                <td className="py-3 md:py-4 px-2 md:px-4">
                  <span className="text-[#b8c5d6] font-medium text-xs md:text-sm">#{index + 1}</span>
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4">
                  <div>
                    <div className="font-semibold text-white text-sm md:text-base">{token.name}</div>
                    <div className="text-xs md:text-sm text-[#6b7280]">{token.symbol}</div>
                  </div>
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 hidden sm:table-cell">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm font-mono text-[#b8c5d6]">
                      {formatAddress(token.tokenAddress)}
                    </span>
                    <button
                      onClick={() => handleCopy(token.tokenAddress)}
                      className="text-[#6b7280] hover:text-[#00FFA3] transition-colors min-w-[20px] min-h-[20px]"
                      title="Copy address"
                    >
                      <Copy className="h-3 w-3 md:h-4 md:w-4" />
                    </button>
                    {copiedAddress === token.tokenAddress && (
                      <span className="text-xs text-[#00FFA3]">Copied!</span>
                    )}
                  </div>
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right">
                  <div className="flex items-center justify-end space-x-1 md:space-x-2">
                    <span className="font-semibold text-xs md:text-sm">{token.progress.toFixed(1)}%</span>
                    {token.progress >= 95 && (
                      <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold bg-[#FF2E86]/20 text-[#FF2E86] pulse-glow">
                        KOTH
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right">
                  <div
                    className={`inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-lg border text-xs md:text-sm ${getScoreBgColor(
                      token.score
                    )}`}
                  >
                    <span className={`font-bold ${getScoreColor(token.score)}`}>
                      {token.score.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right hidden md:table-cell">
                  <span className="text-[#b8c5d6] text-xs md:text-sm">{token.whaleCount}</span>
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end space-x-1">
                    {token.volumeChange24h !== undefined && (
                      token.volumeChange24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-[#00FFA3]" />
                      ) : (
                        <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-[#FF2E86]" />
                      )
                    )}
                    <span className="text-[#b8c5d6] text-xs md:text-sm">
                      {token.volume24h ? `$${formatNumber(token.volume24h)}` : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <a
                    href={getPumpFunUrl(token.tokenAddress, 'cryptoflash')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // Validate address before navigating - Solana addresses are 32-44 chars
                      if (!token.tokenAddress || token.tokenAddress.length < 32) {
                        e.preventDefault()
                        // Try to open anyway - might be valid, just log warning
                        console.warn('Short token address detected:', token.tokenAddress)
                        // Don't prevent default - let it try to open
                      }
                      // Always allow navigation - let pump.fun handle invalid addresses
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black font-semibold hover:opacity-90 transition-opacity glow-mint shadow-lg hover:shadow-[#00FFA3]/50"
                  >
                    <span>BUY</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

