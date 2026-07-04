import type { CurrencyCode, CurrencyInfo } from '../types'
import { CURRENCIES } from '../constants'

export function getCurrency(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
}

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  options: { decimals?: number; showSymbol?: boolean } = {},
): string {
  const { decimals, showSymbol = true } = options
  const currency = getCurrency(currencyCode)
  const converted = amount * currency.rate

  const decimalPlaces = decimals ?? (converted < 1 ? 4 : converted < 100 ? 2 : 2)
  const formatted = converted.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })

  return showSymbol ? `${currency.symbol}${formatted}` : formatted
}

export function formatPrice(price: number, currencyCode: CurrencyCode = 'USD'): string {
  const currency = getCurrency(currencyCode)
  const converted = price * currency.rate
  const decimals = converted < 1 ? 5 : converted < 100 ? 2 : 2
  return `${currency.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining}s`
}

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
