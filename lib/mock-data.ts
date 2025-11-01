import { Token } from './types'

/**
 * Mock token data for testing when APIs are unavailable
 */
export function generateMockTokens(): Token[] {
  const mockTokens: Token[] = []
  
  const names = [
    'DogeKing', 'PepeMoon', 'SolanaDoge', 'BonkInu', 'SamoyedCoin',
    'DiamondHands', 'RocketMoon', 'LamboToken', 'ToTheMoon', 'WhaleToken',
    'BullRun', 'BearSlayer', 'CryptoGem', 'MoonShot', 'MarsRover'
  ]
  
  const symbols = [
    'DOGEK', 'PEPE', 'SOLDOGE', 'BONK', 'SAMO',
    'DIAMOND', 'ROCKET', 'LAMBO', 'MOON', 'WHALE',
    'BULL', 'BEAR', 'GEM', 'SHOT', 'MARS'
  ]
  
  for (let i = 0; i < 50; i++) {
    const progress = 90 + Math.random() * 9 // 90-99%
    const score = 60 + Math.random() * 40 // 60-100
    const whaleCount = Math.floor(Math.random() * 15)
    const volume24h = 10000 + Math.random() * 500000
    
    mockTokens.push({
      tokenAddress: `So${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      name: names[i % names.length] + (i > 14 ? ` ${Math.floor(i / 15) + 1}` : ''),
      symbol: symbols[i % symbols.length] + (i > 14 ? Math.floor(i / 15) + 1 : ''),
      progress: Math.round(progress * 10) / 10,
      priceNative: 0.0001 + Math.random() * 0.01,
      priceUsd: 0.0001 + Math.random() * 0.05,
      liquidity: 50 + Math.random() * 30,
      volume24h,
      volumeChange24h: (Math.random() - 0.5) * 200, // -100% to +100%
      score: Math.round(score * 10) / 10,
      whaleCount,
      whaleInflows: whaleCount * (0.5 + Math.random() * 2),
      rugRisk: 50 + Math.random() * 50,
      fullyDilutedValuation: 100000 + Math.random() * 900000,
      marketCap: 50000 + Math.random() * 450000,
      createdAt: new Date().toISOString()
    })
  }
  
  // Sort by score (highest first)
  mockTokens.sort((a, b) => b.score - a.score)
  
  return mockTokens.slice(0, 50)
}

/**
 * Check if we should use mock data
 * Returns true if API keys are missing or if explicitly requested
 */
export function shouldUseMockData(): boolean {
  const hasMoralisKey = !!process.env.MORALIS_API_KEY && process.env.MORALIS_API_KEY !== ''
  return !hasMoralisKey
}

