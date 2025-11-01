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
    <div className="w-full glass rounded-xl p-4 md:p-6 overflow-x-auto">
      <div className="min-w-full">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Token</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#b8c5d6]">CA</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Progress</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Score</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Whales</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Volume 24h</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <motion.tr
                key={token.tokenAddress}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-[#b8c5d6] font-medium">#{index + 1}</span>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <div className="font-semibold text-white">{token.name}</div>
                    <div className="text-sm text-[#6b7280]">{token.symbol}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-[#b8c5d6]">
                      {formatAddress(token.tokenAddress)}
                    </span>
                    <button
                      onClick={() => handleCopy(token.tokenAddress)}
                      className="text-[#6b7280] hover:text-[#00ff88] transition-colors"
                      title="Copy address"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copiedAddress === token.tokenAddress && (
                      <span className="text-xs text-[#00ff88]">Copied!</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="font-semibold">{token.progress.toFixed(1)}%</span>
                    {token.progress >= 95 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ff006e]/20 text-[#ff006e] pulse-glow">
                        KOTH
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-lg border ${getScoreBgColor(
                      token.score
                    )}`}
                  >
                    <span className={`font-bold ${getScoreColor(token.score)}`}>
                      {token.score.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-[#b8c5d6]">{token.whaleCount}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {token.volumeChange24h !== undefined && (
                      token.volumeChange24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-[#00ff88]" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-[#ff006e]" />
                      )
                    )}
                    <span className="text-[#b8c5d6]">
                      {token.volume24h ? `$${formatNumber(token.volume24h)}` : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <a
                    href={getPumpFunUrl(token.tokenAddress, 'pumpkingsniper')}
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
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold hover:opacity-90 transition-opacity glow-green shadow-lg hover:shadow-[#00ff88]/50"
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

