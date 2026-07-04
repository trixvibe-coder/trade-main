import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTrade } from '../../context/TradeContext'
import { useMarket } from '../../context/MarketContext'
import { useSettings } from '../../context/SettingsContext'
import { StatCard } from '../../components/ui/StatCard'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageTransition } from '../../components/ui/PageTransition'
import { useCountUp } from '../../hooks/useCountUp'
import { formatCurrency, formatDateTime, formatPercent } from '../../utils/format'

function AnimatedStat({ value, format }: { value: number; format: (v: number) => string }) {
  const animated = useCountUp(value)
  return <>{format(animated)}</>
}

export function AdminDashboardPage() {
  const { getAllUsers } = useAuth()
  const { trades, transactions } = useTrade()
  const { assets, settings } = useMarket()
  const { currency } = useSettings()

  const stats = useMemo(() => {
    const users = getAllUsers()
    const regularUsers = users.filter((u) => u.role === 'user')
    const totalBalance = regularUsers.reduce((sum, u) => sum + u.balance, 0)
    const closedTrades = trades.filter((t) => t.status !== 'open')
    const wins = closedTrades.filter((t) => t.status === 'win')
    const volume = trades.reduce((sum, t) => sum + t.investment, 0)

    return {
      totalUsers: regularUsers.length,
      totalBalance,
      totalTrades: trades.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      volume,
    }
  }, [getAllUsers, trades])

  const recentTransactions = transactions.slice(0, 8)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Platform overview and statistics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            label="Total Users"
            value={<AnimatedStat value={stats.totalUsers} format={(v) => v.toFixed(0)} />}
            icon={<Users size={20} />}
            accent="accent"
          />
          <StatCard
            label="Total Balance"
            value={<AnimatedStat value={stats.totalBalance} format={(v) => formatCurrency(v, currency)} />}
            icon={<DollarSign size={20} />}
            accent="buy"
          />
          <StatCard
            label="Total Trades"
            value={<AnimatedStat value={stats.totalTrades} format={(v) => v.toFixed(0)} />}
            icon={<BarChart3 size={20} />}
            accent="default"
          />
          <StatCard
            label="Win Rate"
            value={<AnimatedStat value={stats.winRate} format={(v) => `${v.toFixed(1)}%`} />}
            icon={<Activity size={20} />}
            accent="default"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">Market Status</h2>
              <Badge variant={settings.status === 'running' ? 'success' : 'warning'}>
                {settings.status === 'running' ? 'Running' : 'Paused'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-text-secondary">Mode</span>
                <span className="text-sm font-medium text-text-primary capitalize">{settings.mode}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-text-secondary">Speed</span>
                <span className="text-sm font-medium text-text-primary">{settings.speed}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-text-secondary">Volatility</span>
                <span className="text-sm font-medium text-text-primary">{settings.volatility}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-text-secondary">Trend Strength</span>
                <span className="text-sm font-medium text-text-primary">{settings.trendStrength}%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">Trading Volume</span>
                <span className="text-sm font-medium text-text-primary">{formatCurrency(stats.volume, currency)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-bold text-text-primary mb-4">Asset Prices</h2>
            <div className="space-y-2">
              {assets.slice(0, 6).map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-xs font-bold text-text-primary">
                      {asset.icon}
                    </div>
                    <span className="text-sm font-medium text-text-primary">{asset.symbol}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{formatCurrency(asset.currentPrice, currency)}</p>
                    <p className={`text-xs font-medium ${asset.dailyChangePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                      {formatPercent(asset.dailyChangePercent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-text-secondary text-sm py-8 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-buy/10' : 'bg-sell/10'}`}>
                      {tx.amount > 0 ? <TrendingUp size={14} className="text-buy" /> : <TrendingDown size={14} className="text-sell" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                      <p className="text-xs text-text-secondary">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-buy' : 'text-sell'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  )
}
