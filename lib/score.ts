import { Token } from './types'

export interface ScoreCalculationData {
  curveProgress: number
  curveSpeed: number // 0-10 scale (speed of bonding curve progression)
  whaleInflows: number
  volumeJump: number // Percentage change in 24h volume
  rugRisk: number // 0-100, where 100 = safe, 0 = high risk
}

/**
 * Calculate AI Snipe Score (0-100) based on multiple factors
 * Higher score = better snipe opportunity
 * 
 * Formula (as per requirements):
 * - Curve Progress: 40%
 * - Curve Speed: 20%
 * - Whale Inflows: 15%
 * - Volume Jump: 15%
 * - Rug Risk penalty: -10 (max)
 */
export function calculateScore(data: ScoreCalculationData): number {
  const {
    curveProgress,
    curveSpeed = 0,
    whaleInflows,
    volumeJump,
    rugRisk = 50 // Default medium risk
  } = data

  // Curve Progress: 40% (0-40 points)
  const progressScore = Math.min(curveProgress, 100) * 0.4
  
  // Curve Speed: 20% (0-20 points)
  // Normalize curve speed (0-10 scale) to 0-20 points
  const speedScore = Math.min(curveSpeed, 10) * 2
  
  // Whale Inflows: 15% (0-15 points)
  // Normalize: 10+ SOL whale inflows = max (15 points)
  const whaleScore = Math.min((whaleInflows / 10) * 15, 15)
  
  // Volume Jump: 15% (0-15 points)
  // Normalize: +100% jump = max (15 points), negative jumps = 0
  const volumeScore = Math.min(Math.max(volumeJump, 0), 100) * 0.15
  
  // Rug Risk penalty: -10 (max)
  // rugRisk is 0-100, where 100 = safe, 0 = high risk
  // Penalty: (100 - rugRisk) / 100 * 10
  const rugPenalty = Math.min(((100 - rugRisk) / 100) * 10, 10)

  const totalScore = Math.min(100, Math.max(0,
    progressScore +
    speedScore +
    whaleScore +
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
    curveSpeed: token.curveSpeed || 0,
    whaleInflows: token.whaleInflows || 0,
    volumeJump: token.volumeChange24h || 0,
    rugRisk: token.rugRisk || 50 // Default medium risk
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

