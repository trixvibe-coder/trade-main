import type { Trade, TradeDirection, TradeStatus } from '../types'

export const EPSILON = 0.000001

export type SettlementResult = {
  status: Exclude<TradeStatus, 'open'>
  payout: number
  exitPrice: number
  pnl: number
}

export function settleTrade(
  direction: TradeDirection,
  entryPrice: number,
  exitPrice: number,
  investment: number,
  profitPercent: number,
): SettlementResult {
  const priceDiff = Math.abs(exitPrice - entryPrice)
  const isDraw = priceDiff < EPSILON

  if (isDraw) {
    return {
      status: 'draw',
      payout: investment,
      exitPrice,
      pnl: 0,
    }
  }

  const won =
    direction === 'BUY'
      ? exitPrice > entryPrice
      : exitPrice < entryPrice

  if (won) {
    const payout = investment * (1 + profitPercent / 100)
    return {
      status: 'win',
      payout,
      exitPrice,
      pnl: payout - investment,
    }
  }

  return {
    status: 'loss',
    payout: 0,
    exitPrice,
    pnl: -investment,
  }
}

export function isTradeExpired(trade: Trade, now: number): boolean {
  return trade.status === 'open' && now >= trade.expiresAt
}

export function getRemainingSeconds(trade: Trade, now: number): number {
  return Math.max(0, Math.ceil((trade.expiresAt - now) / 1000))
}

export function getProgressPercent(trade: Trade, now: number): number {
  const elapsed = now - trade.createdAt
  const total = trade.duration * 1000
  return Math.max(0, Math.min(100, ((total - elapsed) / total) * 100))
}

export function getFloatingPnl(
  direction: TradeDirection,
  entryPrice: number,
  currentPrice: number,
  investment: number,
  profitPercent: number,
): number {
  const priceDiff =
    direction === 'BUY'
      ? (currentPrice - entryPrice) / entryPrice
      : (entryPrice - currentPrice) / entryPrice

  return investment * priceDiff * (profitPercent / 100) * 10
}

export function isWinning(
  direction: TradeDirection,
  entryPrice: number,
  currentPrice: number,
): boolean {
  return direction === 'BUY'
    ? currentPrice > entryPrice
    : currentPrice < entryPrice
}
