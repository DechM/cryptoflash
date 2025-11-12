'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import useSWR from 'swr'
import { formatAddress } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  wallet: string
  snipes: number
  profit: string
  success: number
  avgScore?: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function LeaderboardPage() {
  const { data, error, isLoading } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
    '/api/leaderboard',
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
        <div className="mb-8 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-[#ffd700]" />
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Leaderboard
          </h1>
          <p className="text-[#b8c5d6]">
            Top wallets sniping Pump.fun KOTH tokens. Want to join them? Explore the{' '}
            <Link prefetch={false} href="/koth-tracker" className="text-[#00FFA3] hover:underline">
              KOTH Tracker
            </Link>{' '}
            and subscribe to{' '}
            <Link prefetch={false} href="/alerts" className="text-[#00FFA3] hover:underline">
              KOTH alerts
            </Link>.
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 md:p-6 lg:p-8 overflow-x-auto">
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
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6b7280]">
                    Loading leaderboard...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#ef4444]">
                    Error loading leaderboard. Please try again later.
                  </td>
                </tr>
              )}
              {leaderboard.length === 0 && !isLoading && !error && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6b7280]">
                    No leaderboard data available yet. Create alerts to start tracking your snipes!
                  </td>
                </tr>
              )}
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.wallet}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${getRankColor(entry.rank)}`}
                >
                  <td className="py-3 md:py-4 px-2 md:px-4">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4">
                    <span className="font-mono text-white text-xs md:text-sm">{formatAddress(entry.wallet)}</span>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-right hidden sm:table-cell">
                    <span className="text-[#b8c5d6] font-semibold text-xs md:text-sm">{entry.snipes}</span>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-right">
                    <span className="text-[#00FFA3] font-bold text-xs md:text-sm">{entry.profit}</span>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end space-x-1 md:space-x-2">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-[#00FFA3]" />
                      <span className="text-[#00FFA3] font-semibold text-xs md:text-sm">{entry.success}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="mt-8 glass-card rounded-xl p-6 text-center">
          <p className="text-[#b8c5d6] mb-4">
            Want to see your wallet on the leaderboard?
          </p>
          <p className="text-sm text-[#6b7280]">
            Create alerts to start tracking your snipes and compete for the top spots
          </p>
        </div>
      </main>
    </div>
  )
}

