import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, Filter, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTrade } from '../context/TradeContext'
import { useSettings } from '../context/SettingsContext'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { SegmentedControl } from '../components/ui/Controls'
import { PageTransition } from '../components/ui/PageTransition'
import { formatCurrency, formatDateTime, formatDuration } from '../utils/format'
import type { TradeStatus } from '../types'

type StatusFilter = 'all' | TradeStatus

export function HistoryPage() {
  const { user } = useAuth()
  const { getUserTrades } = useTrade()
  const { currency } = useSettings()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const trades = useMemo(() => {
    if (!user) return []
    let result = getUserTrades(user.id).filter((t) => t.status !== 'open')
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(
        (t) => t.symbol.toLowerCase().includes(lower) || t.direction.toLowerCase().includes(lower),
      )
    }
    return result
  }, [user, getUserTrades, statusFilter, search])

  const summary = useMemo(() => {
    const wins = trades.filter((t) => t.status === 'win')
    const losses = trades.filter((t) => t.status === 'loss')
    const draws = trades.filter((t) => t.status === 'draw')
    const totalProfit = wins.reduce((sum, t) => sum + (t.payout - t.investment), 0)
    const totalLoss = losses.reduce((sum, t) => sum + t.investment, 0)
    return {
      totalProfit,
      totalLoss,
      netResult: totalProfit - totalLoss,
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      draws: draws.length,
    }
  }, [trades])

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Trade History</h1>
          <p className="text-text-secondary text-sm mt-1">View your past trading activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-3">
            <p className="text-xs text-text-secondary mb-1">Total Trades</p>
            <p className="text-lg font-bold text-text-primary">{summary.totalTrades}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-text-secondary mb-1">Profit</p>
            <p className="text-lg font-bold text-buy">{formatCurrency(summary.totalProfit, currency)}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-text-secondary mb-1">Loss</p>
            <p className="text-lg font-bold text-sell">{formatCurrency(summary.totalLoss, currency)}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-text-secondary mb-1">Net Result</p>
            <p className={`text-lg font-bold ${summary.netResult >= 0 ? 'text-buy' : 'text-sell'}`}>
              {summary.netResult >= 0 ? '+' : ''}{formatCurrency(summary.netResult, currency)}
            </p>
          </div>
        </div>

        <Input
          placeholder="Search by asset or direction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <SegmentedControl
            options={[
              { label: 'All', value: 'all' },
              { label: 'Wins', value: 'win' },
              { label: 'Losses', value: 'loss' },
              { label: 'Draws', value: 'draw' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          />
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {trades.map((trade) => {
              const isBuy = trade.direction === 'BUY'
              const isWin = trade.status === 'win'
              const isDraw = trade.status === 'draw'
              const pnl = isWin ? trade.payout - trade.investment : isDraw ? 0 : -trade.investment

              return (
                <motion.div
                  key={trade.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuy ? 'bg-buy/10' : 'bg-sell/10'}`}>
                        {isBuy ? <TrendingUp size={18} className="text-buy" /> : <TrendingDown size={18} className="text-sell" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text-primary">{trade.symbol}</p>
                          <Badge variant="neutral">{trade.direction}</Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{formatDateTime(trade.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isWin ? 'text-buy' : isDraw ? 'text-text-secondary' : 'text-sell'}`}>
                        {isWin ? '+' : isDraw ? '' : ''}{formatCurrency(pnl, currency)}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Badge variant={isWin ? 'success' : isDraw ? 'neutral' : 'error'}>
                          {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-text-secondary">Entry Price</p>
                      <p className="text-xs font-medium text-text-primary">{formatCurrency(trade.entryPrice, currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary">Exit Price</p>
                      <p className="text-xs font-medium text-text-primary">
                        {trade.exitPrice ? formatCurrency(trade.exitPrice, currency) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary">Investment</p>
                      <p className="text-xs font-medium text-text-primary">{formatCurrency(trade.investment, currency)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-text-secondary">Profit %</p>
                      <p className="text-xs font-medium text-text-primary">{trade.profitPercent}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary">Payout</p>
                      <p className="text-xs font-medium text-text-primary">{formatCurrency(trade.payout, currency)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-text-secondary" />
                      <p className="text-xs font-medium text-text-secondary">{formatDuration(trade.duration)}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {trades.length === 0 && (
            <div className="py-16 text-center">
              <Filter size={32} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No trades found</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
