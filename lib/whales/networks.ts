export type NetworkKind = 'solana' | 'evm'

export interface NetworkConfig {
  key: string
  kind: NetworkKind
  bitqueryNetwork: string
  explorerTxUrl: (hash: string) => string
  displayName: string
}

const makeExplorer = (base: string) => (hash: string) => `${base}${hash}`

export const NETWORKS: Record<string, NetworkConfig> = {
  solana: {
    key: 'solana',
    kind: 'solana',
    bitqueryNetwork: 'mainnet',
    explorerTxUrl: makeExplorer('https://solscan.io/tx/'),
    displayName: 'Solana'
  },
  ethereum: {
    key: 'ethereum',
    kind: 'evm',
    bitqueryNetwork: 'eth',
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
    bitqueryNetwork: 'polygon',
    explorerTxUrl: makeExplorer('https://polygonscan.com/tx/'),
    displayName: 'Polygon'
  },
  base: {
    key: 'base',
    kind: 'evm',
    bitqueryNetwork: 'base',
    explorerTxUrl: makeExplorer('https://basescan.org/tx/'),
    displayName: 'Base'
  },
  arbitrum: {
    key: 'arbitrum',
    kind: 'evm',
    bitqueryNetwork: 'arbitrum',
    explorerTxUrl: makeExplorer('https://arbiscan.io/tx/'),
    displayName: 'Arbitrum'
  },
  optimism: {
    key: 'optimism',
    kind: 'evm',
    bitqueryNetwork: 'optimism',
    explorerTxUrl: makeExplorer('https://optimistic.etherscan.io/tx/'),
    displayName: 'Optimism'
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
  solana: 'solana',
  ethereum: 'ethereum',
  'binance-smart-chain': 'bsc',
  'polygon-pos': 'polygon',
  base: 'base',
  'arbitrum-one': 'arbitrum',
  'optimistic-ethereum': 'optimism',
  avalanche: 'avalanche'
}


