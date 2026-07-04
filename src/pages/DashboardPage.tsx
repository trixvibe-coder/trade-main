import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, BarChart3, Percent, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTrade } from '../context/TradeContext'
import { useSettings } from '../context/SettingsContext'
import { useMarket } from '../context/MarketContext'
import { StatCard } from '../components/ui/StatCard'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageTransition } from '../components/ui/PageTransition'
import { useCountUp } from '../hooks/useCountUp'
import { formatCurrency, formatPercent, formatDateTime } from '../utils/format'
import type { Trade } from '../types'

function AnimatedStat({ value, format }: { value: number; format: (v: number) => string }) {
  const animated = useCountUp(value)
  return <>{format(animated)}</>
}

export function DashboardPage() {
  const { user } = useAuth()
  const { getUserTrades } = useTrade()
  const { currency } = useSettings()
  const { assets } = useMarket()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const userTrades = user ? getUserTrades(user.id) : []
    const closedTrades = userTrades.filter((t) => t.status !== 'open')
    const wins = closedTrades.filter((t) => t.status === 'win')
    const losses = closedTrades.filter((t) => t.status === 'loss')
    const profit = wins.reduce((sum, t) => sum + (t.payout - t.investment), 0)
    const loss = losses.reduce((sum, t) => sum + t.investment, 0)
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0

    return {
      balance: user?.balance || 0,
      profit,
      loss,
      totalTrades: userTrades.length,
      winRate,
      recentTrades: userTrades.slice(0, 5),
    }
  }, [user, getUserTrades])

  const topMovers = useMemo(() => {
    return [...assets]
      .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
      .slice(0, 3)
  }, [assets])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.username}</h1>
          <p className="text-text-secondary text-sm mt-1">Here's your trading overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            label="Balance"
            value={<AnimatedStat value={stats.balance} format={(v) => formatCurrency(v, currency)} />}
            icon={<Wallet size={20} />}
            accent="accent"
          />
          <StatCard
            label="Total Profit"
            value={<AnimatedStat value={stats.profit} format={(v) => formatCurrency(v, currency)} />}
            icon={<TrendingUp size={20} />}
            accent="buy"
            trend={stats.profit > 0 ? { value: formatPercent((stats.profit / (stats.balance || 1)) * 100), positive: true } : undefined}
          />
          <StatCard
            label="Total Loss"
            value={<AnimatedStat value={stats.loss} format={(v) => formatCurrency(v, currency)} />}
            icon={<TrendingDown size={20} />}
            accent="sell"
          />
          <StatCard
            label="Win Rate"
            value={<AnimatedStat value={stats.winRate} format={(v) => `${v.toFixed(1)}%`} />}
            icon={<Percent size={20} />}
            accent="default"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-accent" />
                <h2 className="text-base font-bold text-text-primary">Recent Trades</h2>
              </div>
              <button
                onClick={() => navigate('/history')}
                className="text-sm text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            {stats.recentTrades.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-secondary text-sm">No trades yet. Start trading to see your history here.</p>
                <button
                  onClick={() => navigate('/trading')}
                  className="mt-4 text-accent font-medium text-sm hover:underline"
                >
                  Go to Trading
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentTrades.map((trade) => (
                  <TradeRow key={trade.id} trade={trade} currency={currency} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-bold text-text-primary mb-4">Top Movers</h2>
            <div className="space-y-3">
              {topMovers.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => navigate(`/trading?symbol=${asset.symbol}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-sm font-bold text-text-primary">
                      {asset.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-text-primary">{asset.symbol}</p>
                      <p className="text-xs text-text-secondary">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(asset.currentPrice, currency)}
                    </p>
                    <p className={`text-xs font-medium ${asset.dailyChangePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                      {formatPercent(asset.dailyChangePercent)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text-primary">Quick Trade</h2>
            <button
              onClick={() => navigate('/market')}
              className="text-sm text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              All markets <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {assets.slice(0, 4).map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => navigate(`/trading?symbol=${asset.symbol}`)}
                className="p-3 rounded-xl bg-surface border border-border hover:border-accent/30 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-xs font-bold text-text-primary">
                    {asset.icon}
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{asset.symbol}</span>
                </div>
                <p className="text-sm font-bold text-text-primary">
                  {formatCurrency(asset.currentPrice, currency)}
                </p>
                <p className={`text-xs font-medium ${asset.dailyChangePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                  {formatPercent(asset.dailyChangePercent)}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  )
}

function TradeRow({ trade, currency }: { trade: Trade; currency: any }) {
  const isBuy = trade.direction === 'BUY'
  const isWin = trade.status === 'win'
  const isLoss = trade.status === 'loss'
  const isDraw = trade.status === 'draw'
  const isOpen = trade.status === 'open'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-border/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isBuy ? 'bg-buy/10' : 'bg-sell/10'
          }`}
        >
          {isBuy ? <TrendingUp size={16} className="text-buy" /> : <TrendingDown size={16} className="text-sell" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{trade.symbol}</p>
          <p className="text-xs text-text-secondary">{formatDateTime(trade.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary">{formatCurrency(trade.investment, currency)}</p>
          <p className="text-xs text-text-secondary">{isBuy ? 'BUY' : 'SELL'}</p>
        </div>
        <Badge variant={isWin ? 'success' : isLoss ? 'error' : isDraw ? 'neutral' : 'info'}>
          {isOpen ? 'Open' : isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'}
        </Badge>
      </div>
    </motion.div>
  )
}
