export type MarketMode = 'random' | 'uptrend' | 'downtrend'

export type MarketStatus = 'running' | 'paused'

export type TradeDirection = 'BUY' | 'SELL'

export type TradeStatus = 'win' | 'loss' | 'draw' | 'open'

export type AssetCategory = 'crypto' | 'forex' | 'commodity'

export type UserRole = 'user' | 'admin'

export type CurrencyCode = 'USD' | 'IDR' | 'EUR' | 'GBP' | 'JPY' | 'SGD' | 'MYR'

export type Language = 'en' | 'id' | 'es' | 'fr' | 'de' | 'ja' | 'zh'

export interface Asset {
  symbol: string
  name: string
  category: AssetCategory
  basePrice: number
  currentPrice: number
  dailyChange: number
  dailyChangePercent: number
  icon: string
  favorites: string[]
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export interface Trade {
  id: string
  userId: string
  symbol: string
  assetName: string
  direction: TradeDirection
  investment: number
  profitPercent: number
  entryPrice: number
  exitPrice: number | null
  status: TradeStatus
  payout: number
  duration: number
  createdAt: number
  expiresAt: number
  closedAt: number | null
}

export interface User {
  id: string
  username: string
  email: string
  password: string
  balance: number
  role: UserRole
  avatar: string
  isBlocked: boolean
  createdAt: number
  currency: CurrencyCode
  language: Language
  notifications: boolean
  darkTheme: boolean
}

export interface Transaction {
  id: string
  userId: string
  type: 'deposit' | 'withdraw' | 'trade' | 'admin_adjustment'
  amount: number
  description: string
  createdAt: number
}

export interface MarketSettings {
  status: MarketStatus
  mode: MarketMode
  speed: number
  trendStrength: number
  volatility: number
  startingPrice: number
}

export interface CurrencyInfo {
  code: CurrencyCode
  symbol: string
  name: string
  rate: number
}
