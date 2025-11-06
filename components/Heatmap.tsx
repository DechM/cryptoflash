'use client'

import { Token } from '@/lib/types'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts'
import { useMemo } from 'react'

interface HeatmapProps {
  tokens: Token[]
}

export function Heatmap({ tokens }: HeatmapProps) {
  const data = useMemo(() => {
    return tokens.map((token) => ({
      x: token.progress,
      y: (token.volumeChange24h || 0) + (token.whaleInflows || 0), // Momentum
      z: token.score, // Size
      name: token.name,
      symbol: token.symbol,
      score: token.score,
      progress: token.progress,
      address: token.tokenAddress
    }))
  }, [tokens])

  const getColor = (score: number) => {
    if (score >= 90) return '#00FFA3' // Mint
    if (score >= 75) return '#00D1FF' // Cyan
    if (score >= 60) return '#ffd700' // Yellow
    if (score >= 45) return '#ff6b35' // Orange
    return '#FF2E86' // Magenta
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass rounded-lg p-4 border border-white/10">
          <p className="font-semibold text-white">{data.name} ({data.symbol})</p>
          <p className="text-sm text-[#b8c5d6]">Progress: {data.progress.toFixed(1)}%</p>
          <p className="text-sm text-[#b8c5d6]">Score: {data.score.toFixed(1)}</p>
          <p className="text-xs text-[#6b7280] font-mono mt-2">{data.address.slice(0, 8)}...</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full glass-card rounded-xl p-4 md:p-6 hover-lift">
      <h3 className="text-lg font-semibold mb-4 text-white">KOTH Heatmap</h3>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="Progress"
              label={{ value: 'Bonding Curve Progress (%)', position: 'insideBottom', offset: -5 }}
              domain={[80, 100]}
              tick={{ fill: '#b8c5d6', fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Momentum"
              label={{ value: 'Momentum (Volume + Whales)', angle: -90, position: 'insideLeft' }}
              tick={{ fill: '#b8c5d6', fontSize: 12 }}
              stroke="#6b7280"
            />
            <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Score" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Tokens" data={data} fill="#00FFA3">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.z)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#00FFA3]"></div>
          <span className="text-[#b8c5d6]">High Score (90+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#00D1FF]"></div>
          <span className="text-[#b8c5d6]">Good (75-89)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ffd700]"></div>
          <span className="text-[#b8c5d6]">Medium (60-74)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#FF2E86]"></div>
          <span className="text-[#b8c5d6]">Low (&lt;60)</span>
        </div>
      </div>
    </div>
  )
}

