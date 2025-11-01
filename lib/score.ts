import { Token } from './types'

export interface ScoreCalculationData {
  curveProgress: number
  whaleInflows: number
  volumeJump: number
  rugRisk: number
  hypeScore?: number
}

/**
 * Calculate AI Snipe Score (0-100) based on multiple factors
 * Higher score = better snipe opportunity
 */
export function calculateScore(data: ScoreCalculationData): number {
  const {
    curveProgress,
    whaleInflows,
    volumeJump,
    rugRisk,
    hypeScore = 50 // Default neutral if not available
  } = data

  // Weight distribution:
  // - Curve Progress: 40% (most important - closer to KOTH = higher score)
  // - Whale Inflows: 30% (whale activity indicates confidence)
  // - Hype Score: 20% (social sentiment)
  // - Volume Jump: 10% (momentum indicator)
  // - Rug Risk: -10% (penalty for high risk)

  const progressScore = Math.min(curveProgress, 100) * 0.4
  
  // Whale inflows: normalize to 0-100 scale
  // 10+ whale buys = max score, scale linearly
  const whaleScore = Math.min((whaleInflows / 10) * 100, 100) * 0.3
  
  // Hype score: already 0-100 scale
  const hypeScoreWeighted = hypeScore * 0.2
  
  // Volume jump: positive jumps increase score
  // Normalize: +100% jump = max (10 points)
  const volumeScore = Math.min(Math.max(volumeJump, 0), 100) * 0.1
  
  // Rug risk: subtract penalty (0-100, where 100 = safe, 0 = rug risk)
  const rugPenalty = (100 - rugRisk) * 0.1

  const totalScore = Math.min(100, Math.max(0,
    progressScore +
    whaleScore +
    hypeScoreWeighted +
    volumeScore -
    rugPenalty
  ))

  return Math.round(totalScore * 100) / 100 // Round to 2 decimals
}

/**
 * Calculate score from token data
 */
export function calculateTokenScore(token: Partial<Token>): number {
  return calculateScore({
    curveProgress: token.progress || 0,
    whaleInflows: token.whaleInflows || 0,
    volumeJump: token.volumeChange24h || 0,
    rugRisk: token.rugRisk || 50, // Default medium risk
    hypeScore: token.hypeScore
  })
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400' // High score - green
  if (score >= 75) return 'text-green-300' // Good score
  if (score >= 60) return 'text-yellow-400' // Medium score - yellow
  if (score >= 45) return 'text-orange-400' // Low-medium - orange
  return 'text-red-400' // Low score - red
}

/**
 * Get score background color
 */
export function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-500/20 border-green-500/50'
  if (score >= 75) return 'bg-green-500/10 border-green-500/30'
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30'
  if (score >= 45) return 'bg-orange-500/10 border-orange-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

