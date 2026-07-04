import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type { Trade, Transaction, TradeDirection } from '../types'
import { STORAGE_KEYS } from '../constants'
import { getItem, setItem, generateId } from '../utils/storage'
import { useAuth } from './AuthContext'
import { settleTrade } from '../engine/tradeService'

export interface SettlementResult {
  tradeId: string
  status: 'win' | 'loss' | 'draw'
  payout: number
  pnl: number
  symbol: string
  direction: TradeDirection
  investment: number
}

interface TradeContextValue {
  trades: Trade[]
  transactions: Transaction[]
  openTrade: (params: {
    symbol: string
    assetName: string
    direction: TradeDirection
    investment: number
    profitPercent: number
    entryPrice: number
    duration: number
  }) => Trade | null
  settleTradeById: (tradeId: string, exitPrice: number) => SettlementResult | null
  getUserTrades: (userId: string) => Trade[]
  getUserTransactions: (userId: string) => Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  getAllTransactions: () => Transaction[]
  deleteTrade: (tradeId: string) => void
}

const TradeContext = createContext<TradeContextValue | null>(null)

export function TradeProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuth()
  const [trades, setTrades] = useState<Trade[]>(() => getItem<Trade[]>(STORAGE_KEYS.TRADES, []))
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []),
  )

  const tradesRef = useRef(trades)
  tradesRef.current = trades

  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    setItem(STORAGE_KEYS.TRADES, trades)
  }, [trades])

  useEffect(() => {
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions)
  }, [transactions])

  const openTrade: TradeContextValue['openTrade'] = useCallback(
    (params) => {
      if (!user) return null
      if (user.balance < params.investment) return null

      const now = Date.now()
      const trade: Trade = {
        id: generateId(),
        userId: user.id,
        symbol: params.symbol,
        assetName: params.assetName,
        direction: params.direction,
        investment: params.investment,
        profitPercent: params.profitPercent,
        entryPrice: params.entryPrice,
        exitPrice: null,
        status: 'open',
        payout: params.investment * (1 + params.profitPercent / 100),
        duration: params.duration,
        createdAt: now,
        expiresAt: now + params.duration * 1000,
        closedAt: null,
      }

      setTrades((prev) => [trade, ...prev])
      updateProfile({ balance: user.balance - params.investment })

      const tx: Transaction = {
        id: generateId(),
        userId: user.id,
        type: 'trade',
        amount: -params.investment,
        description: `Trade opened: ${params.direction} ${params.symbol}`,
        createdAt: now,
      }
      setTransactions((prev) => [tx, ...prev])

      return trade
    },
    [user, updateProfile],
  )

  const settleTradeById: TradeContextValue['settleTradeById'] = useCallback(
    (tradeId, exitPrice) => {
      const currentTrades = tradesRef.current
      const tradeIndex = currentTrades.findIndex((t) => t.id === tradeId && t.status === 'open')
      if (tradeIndex === -1) return null

      const trade = currentTrades[tradeIndex]
      const settlement = settleTrade(
        trade.direction,
        trade.entryPrice,
        exitPrice,
        trade.investment,
        trade.profitPercent,
      )

      const updatedTrade: Trade = {
        ...trade,
        exitPrice: settlement.exitPrice,
        status: settlement.status,
        closedAt: Date.now(),
      }

      setTrades((prev) => {
        const idx = prev.findIndex((t) => t.id === tradeId && t.status === 'open')
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = updatedTrade
        return next
      })

      const result: SettlementResult = {
        tradeId,
        status: settlement.status,
        payout: settlement.payout,
        pnl: settlement.pnl,
        symbol: trade.symbol,
        direction: trade.direction,
        investment: trade.investment,
      }

      if (settlement.payout > 0 && userRef.current) {
        updateProfile({ balance: userRef.current.balance + settlement.payout })
      }

      const tx: Transaction = {
        id: generateId(),
        userId: trade.userId,
        type: 'trade',
        amount: settlement.payout,
        description: `Trade ${settlement.status}: ${trade.direction} ${trade.symbol}`,
        createdAt: Date.now(),
      }
      setTransactions((prev) => [tx, ...prev])

      return result
    },
    [updateProfile],
  )

  const getUserTrades = useCallback(
    (userId: string) => trades.filter((t) => t.userId === userId),
    [trades],
  )

  const getUserTransactions = useCallback(
    (userId: string) => transactions.filter((t) => t.userId === userId),
    [transactions],
  )

  const addTransaction: TradeContextValue['addTransaction'] = useCallback((tx) => {
    const full: Transaction = { ...tx, id: generateId(), createdAt: Date.now() }
    setTransactions((prev) => [full, ...prev])
  }, [])

  const getAllTransactions = useCallback(() => transactions, [transactions])

  const deleteTrade = useCallback((tradeId: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== tradeId))
  }, [])

  return (
    <TradeContext.Provider
      value={{
        trades,
        transactions,
        openTrade,
        settleTradeById,
        getUserTrades,
        getUserTransactions,
        addTransaction,
        getAllTransactions,
        deleteTrade,
      }}
    >
      {children}
    </TradeContext.Provider>
  )
}

export function useTrade() {
  const ctx = useContext(TradeContext)
  if (!ctx) throw new Error('useTrade must be used within TradeProvider')
  return ctx
}
