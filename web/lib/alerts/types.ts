// CryptoFlash Alert Types - Similar to Whale Alert but with our branding

export type Blockchain = 'ethereum' | 'bitcoin' | 'bsc' | 'solana' | 'polygon' | 'arbitrum';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertType = 
  | 'large_transfer'
  | 'exchange_transfer'
  | 'whale_buy'
  | 'whale_sell'
  | 'token_burn'
  | 'exchange_withdrawal'
  | 'exchange_deposit'
  | 'unknown_wallet_activity';

export type KnownLabel = 
  | 'Binance'
  | 'Coinbase'
  | 'Kraken'
  | 'FTX'
  | 'Uniswap'
  | 'Unknown Wallet'
  | string; // Custom labels

export type TransactionParticipant = {
  address: string;
  label?: KnownLabel;
  amount: string; // Raw amount (wei, satoshi, etc.)
  amountUsd: number;
};

export type CryptoFlashAlert = {
  id: string;
  blockchain: Blockchain;
  
  // Transaction details
  txHash: string;
  timestamp: number; // Unix timestamp in ms
  blockNumber?: number;
  fee: string; // Transaction fee
  feeUsd?: number;
  
  // Crypto price at transaction time
  cryptoPriceAtTx: number;
  
  // Token info (emoji is fetched dynamically from token-emoji.ts)
  token: {
    symbol: string;
    name: string;
    decimals: number;
    amount: string; // Raw amount
    amountUsd: number;
  };
  
  // Transfer details
  from: TransactionParticipant;
  to: TransactionParticipant[];
  
  // Alert metadata
  alertType: AlertType;
  severity: AlertSeverity;
  
  // Social integration
  xPostUrl?: string; // Link to X (Twitter) post if auto-posted
  
  // UI helpers
  timeAgo: string; // e.g., "2 mins ago"
  isNew?: boolean; // For animations
};

export type AlertFilters = {
  blockchains?: Blockchain[];
  alertTypes?: AlertType[];
  severities?: AlertSeverity[];
  minAmountUsd?: number;
  maxAmountUsd?: number;
  tokens?: string[]; // Token symbols
  labels?: KnownLabel[]; // e.g., only "Binance" transfers
};

// Known exchange addresses (for labeling)
export const KNOWN_EXCHANGES: Record<Blockchain, Record<string, KnownLabel>> = {
  ethereum: {
    '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance',
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549': 'Binance',
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE': 'Binance',
    '0xd551234Ae421e3BCBA99A0Da6d736074f22192FF': 'Binance',
    '0x564286362092D8e7936f0549571a803B203aAceD': 'Binance',
    '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF': 'Binance',
    '0xfE9e8709d3215310075d67E3ED32A380CCf451C8': 'Binance',
    '0x4e9ce36e442e55EcD9025B9a6E0D88485d628A67': 'Binance',
    '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8': 'Binance',
    '0xF977814e90dA44bFA03b6295A0616a897441aceC': 'Binance',
    '0x001866ae5B3de6cA6F5E8D4E5e5f6E5f7E5f8E5f': 'Coinbase',
    '0x4f3a120E72C76c22ae802D129F919BF5aC02915e': 'Coinbase',
    '0xd780Ae2Bf04cD96E577D3D014762f831d97129d0': 'Coinbase',
    '0xA9D1e08C7793af67e9d92c308F980E1BaA3cF2EB': 'Kraken',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb': 'Vitalik Buterin',
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': 'Vitalik.eth',
  },
  bitcoin: {
    '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': 'Binance',
    '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r': 'Bitfinex',
    '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy': 'Binance',
  },
  bsc: {
    '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3': 'Binance',
    '0xe2fc31F816A9b94326492132018C3aEcC4a93aE1': 'Binance',
  },
  solana: {},
  polygon: {},
  arbitrum: {},
};

// Minimum amount thresholds for alerts (in USD)
export const ALERT_THRESHOLDS = {
  low: 100000,      // $100k
  medium: 500000,   // $500k
  high: 1000000,    // $1M
  critical: 10000000, // $10M
};

