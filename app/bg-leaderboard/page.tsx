'use client'

import { Navbar } from '@/components/Navbar'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface LeaderboardEntry {
  rank: number
  wallet: string
  snipes: number
  profit: string
  success: number
  avgScore?: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function BGLeaderboardPage() {
  const { data, error, isLoading } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
    '/api/leaderboard/bg',
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: true
    }
  )

  const leaderboard = data?.leaderboard || []
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-[#ffd700]" />
    if (rank === 2) return <Medal className="h-6 w-6 text-[#c0c0c0]" />
    if (rank === 3) return <Award className="h-6 w-6 text-[#cd7f32]" />
    return <span className="text-[#6b7280] font-bold">#{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'border-[#ffd700] bg-[#ffd700]/10'
    if (rank === 2) return 'border-[#c0c0c0] bg-[#c0c0c0]/10'
    if (rank === 3) return 'border-[#cd7f32] bg-[#cd7f32]/10'
    return 'border-white/10'
  }

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Trophy className="h-16 w-16 mx-auto mb-4 text-[#ffd700]" />
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            BG Leaderboard
          </h1>
          <p className="text-[#b8c5d6]">
            Top Bulgarian wallets sniping Pump.fun KOTH tokens
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 md:p-6 lg:p-8 overflow-x-auto"
        >
          <div className="min-w-full">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Rank</th>
                  <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Wallet</th>
                  <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6] hidden sm:table-cell">Snipes</th>
                  <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6]">Profit</th>
                  <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#b8c5d6] hidden md:table-cell">Success</th>
                </tr>
              </thead>
            <tbody>
              {leaderboard.length === 0 && !isLoading && !error && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6b7280]">
                    No leaderboard data available yet. Check back soon!
                  </td>
                </tr>
              )}
              {leaderboard.map((entry, index) => (
                <motion.tr
                  key={entry.wallet}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${getRankColor(entry.rank)}`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-white">{entry.wallet}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-[#b8c5d6] font-semibold">{entry.snipes}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-[#00FFA3] font-bold">{entry.profit}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <TrendingUp className="h-4 w-4 text-[#00FFA3]" />
                      <span className="text-[#00FFA3] font-semibold">{entry.success}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 glass rounded-xl p-6 text-center"
        >
          <p className="text-[#b8c5d6] mb-4">
            Want to see your wallet on the leaderboard?
          </p>
          <p className="text-sm text-[#6b7280]">
            Connect your wallet or link your Telegram to start tracking your snipes
          </p>
        </motion.div>
      </main>
    </div>
  )
}

