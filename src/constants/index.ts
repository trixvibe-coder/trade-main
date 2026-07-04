import type { CurrencyInfo, CurrencyCode, Language, Asset } from '../types'

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 16200 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 161 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.35 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.7 },
]

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'id', name: 'Bahasa Indonesia', flag: 'ID' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'ja', name: '日本語', flag: 'JA' },
  { code: 'zh', name: '中文', flag: 'ZH' },
]

export const DEFAULT_ASSETS: Omit<Asset, 'currentPrice' | 'dailyChange' | 'dailyChangePercent' | 'favorites'>[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', category: 'crypto', basePrice: 67500, icon: '₿' },
  { symbol: 'ETH/USD', name: 'Ethereum', category: 'crypto', basePrice: 3450, icon: 'Ξ' },
  { symbol: 'EUR/USD', name: 'Euro / Dollar', category: 'forex', basePrice: 1.085, icon: '€' },
  { symbol: 'XAU/USD', name: 'Gold', category: 'commodity', basePrice: 2380, icon: 'Au' },
  { symbol: 'WTI/USD', name: 'Crude Oil', category: 'commodity', basePrice: 78.5, icon: 'Oi' },
  { symbol: 'SOL/USD', name: 'Solana', category: 'crypto', basePrice: 168, icon: '◎' },
  { symbol: 'GBP/USD', name: 'Pound / Dollar', category: 'forex', basePrice: 1.27, icon: '£' },
  { symbol: 'XAG/USD', name: 'Silver', category: 'commodity', basePrice: 30.5, icon: 'Ag' },
]

export const TRADE_DURATIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 },
]

export const PROFIT_PERCENTAGES = [70, 80, 85, 90, 92]

export const ADMIN_CREDENTIALS = {
  email: 'admin@tradeflow.io',
  password: 'admin123',
}

export const STORAGE_KEYS = {
  USERS: 'tradeflow_users',
  CURRENT_USER: 'tradeflow_current_user',
  TRADES: 'tradeflow_trades',
  TRANSACTIONS: 'tradeflow_transactions',
  MARKET_SETTINGS: 'tradeflow_market_settings',
  ASSET_PRICES: 'tradeflow_asset_prices',
  FAVORITES: 'tradeflow_favorites',
  SETTINGS: 'tradeflow_settings',
}
