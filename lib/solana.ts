import { PublicKey } from '@solana/web3.js'

const COMMON_PATTERNS = ['pump', '.pump', '-pump', '_pump', 'come']

export function isValidSolanaAddress(address?: string | null): boolean {
  if (!address) return false
  try {
    // eslint-disable-next-line no-new
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export function sanitizeSolanaAddress(address?: string | null): string | null {
  if (!address) return null
  const initial = address.trim()
  if (!initial) return null

  const visited = new Set<string>()
  const queue: string[] = [initial]

  const tryEnqueue = (value: string) => {
    if (!value) return
    if (visited.has(value)) return
    queue.push(value)
  }

  while (queue.length > 0) {
    const candidate = queue.shift()!
    if (visited.has(candidate)) {
      continue
    }
    visited.add(candidate)

    const lower = candidate.toLowerCase()
    for (const pattern of COMMON_PATTERNS) {
      let index = lower.indexOf(pattern)
      while (index !== -1) {
        const stripped = candidate.slice(0, index) + candidate.slice(index + pattern.length)
        tryEnqueue(stripped)
        index = lower.indexOf(pattern, index + 1)
      }
    }

    if (candidate.length < 32) {
      continue
    }

    if (candidate.length > 44) {
      tryEnqueue(candidate.slice(0, 44))
      tryEnqueue(candidate.slice(0, candidate.length - 1))
      continue
    }

    if (isValidSolanaAddress(candidate)) {
      return candidate
    }
  }

  return null
}

