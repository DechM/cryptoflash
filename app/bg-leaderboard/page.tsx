'use client'

import { Navbar } from '@/components/Navbar'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock data - in production, fetch from API with Bulgarian wallet filtering
const mockLeaderboard = [
  { rank: 1, wallet: '8k3j...x9p2', snipes: 42, profit: '$125,420', success: 92 },
  { rank: 2, wallet: '2m7n...q5w8', snipes: 38, profit: '$98,320', success: 87 },
  { rank: 3, wallet: '9h4k...r6t1', snipes: 35, profit: '$87,150', success: 85 },
  { rank: 4, wallet: '5v8b...s3n7', snipes: 31, profit: '$76,890', success: 82 },
  { rank: 5, wallet: '1c6d...m9p4', snipes: 28, profit: '$65,420', success: 79 },
  { rank: 6, wallet: '7x2z...k8h3', snipes: 25, profit: '$54,210', success: 76 },
  { rank: 7, wallet: '3n9m...j5f2', snipes: 22, profit: '$48,750', success: 73 },
  { rank: 8, wallet: '6p8q...g7w1', snipes: 19, profit: '$42,380', success: 70 },
  { rank: 9, wallet: '4r5t...v6y9', snipes: 16, profit: '$36,920', success: 68 },
  { rank: 10, wallet: '1a2s...d3f4', snipes: 14, profit: '$31,450', success: 65 },
]

export default function BGLeaderboardPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
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
          className="glass rounded-xl p-6 md:p-8 overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Wallet</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Snipes</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Total Profit</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#b8c5d6]">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((entry, index) => (
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
                    <span className="text-[#00ff88] font-bold">{entry.profit}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <TrendingUp className="h-4 w-4 text-[#00ff88]" />
                      <span className="text-[#00ff88] font-semibold">{entry.success}%</span>
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

