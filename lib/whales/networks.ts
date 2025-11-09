export type NetworkKind = 'evm'

export interface NetworkConfig {
  key: string
  kind: NetworkKind
  bitqueryNetwork: string
  explorerTxUrl: (hash: string) => string
  displayName: string
}

const makeExplorer = (base: string) => (hash: string) => `${base}${hash}`

export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    key: 'ethereum',
    kind: 'evm',
    bitqueryNetwork: 'ethereum',
    explorerTxUrl: makeExplorer('https://etherscan.io/tx/'),
    displayName: 'Ethereum'
  },
  bsc: {
    key: 'bsc',
    kind: 'evm',
    bitqueryNetwork: 'bsc',
    explorerTxUrl: makeExplorer('https://bscscan.com/tx/'),
    displayName: 'BNB Chain'
  },
  polygon: {
    key: 'polygon',
    kind: 'evm',
    bitqueryNetwork: 'matic',
    explorerTxUrl: makeExplorer('https://polygonscan.com/tx/'),
    displayName: 'Polygon'
  },
  avalanche: {
    key: 'avalanche',
    kind: 'evm',
    bitqueryNetwork: 'avalanche',
    explorerTxUrl: makeExplorer('https://snowtrace.io/tx/'),
    displayName: 'Avalanche'
  }
}

export const COINGECKO_PLATFORM_TO_NETWORK: Record<string, keyof typeof NETWORKS> = {
  ethereum: 'ethereum',
  'ethereum-erc20': 'ethereum',
  'binance-smart-chain': 'bsc',
  'polygon-pos': 'polygon',
  avalanche: 'avalanche'
}

export const DEFAULT_PLATFORM_PRIORITY: string[] = [
  'ethereum',
  'polygon-pos',
  'binance-smart-chain',
  'avalanche'
]

export const STABLE_PLATFORM_PRIORITY: string[] = [
  'ethereum',
  'polygon-pos',
  'binance-smart-chain'
]

export const STABLE_ALLOWED_NETWORKS: Set<keyof typeof NETWORKS> = new Set([
  'ethereum',
  'polygon',
  'bsc',
  'avalanche'
])

export const STABLE_COIN_IDS: Set<string> = new Set([
  'usd-coin',
  'usd-coin-wormhole',
  'usd-coin-bridged',
  'tether',
  'tether-usdt',
  'paypal-usd',
  'pyusd',
  'cashusd',
  'usd1',
  'usdr',
  'uscr',
  'dai',
  'frax'
])


