import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowDownLeft, ArrowUpRight, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { useTrade } from '../../context/TradeContext'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { SegmentedControl } from '../../components/ui/Controls'
import { PageTransition } from '../../components/ui/PageTransition'
import { formatCurrency, formatDateTime } from '../../utils/format'

type FilterType = 'all' | 'deposit' | 'withdraw' | 'trade' | 'admin_adjustment'

export function AdminTransactionsPage() {
  const { getAllTransactions } = useTrade()
  const { getAllUsers } = useAuth()
  const { currency } = useSettings()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const transactions = getAllTransactions()
  const users = getAllUsers()

  const filtered = useMemo(() => {
    let result = transactions
    if (filter !== 'all') {
      result = result.filter((t) => t.type === filter)
    }
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          users.find((u) => u.id === t.userId)?.username.toLowerCase().includes(lower),
      )
    }
    return result
  }, [transactions, filter, search, users])

  const stats = useMemo(() => {
    const deposits = transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
    const withdrawals = transactions.filter((t) => t.type === 'withdraw').reduce((s, t) => s + Math.abs(t.amount), 0)
    const tradeVolume = transactions.filter((t) => t.type === 'trade').reduce((s, t) => s + Math.abs(t.amount), 0)
    return { deposits, withdrawals, tradeVolume, total: transactions.length }
  }, [transactions])

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.username || 'Unknown'
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
          <p className="text-text-secondary text-sm mt-1">All platform transactions</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3">
            <p className="text-xs text-text-secondary mb-1">Total Transactions</p>
            <p className="text-lg font-bold text-text-primary">{stats.total}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-text-secondary mb-1">Deposits</p>
            <p className="text-lg font-bold text-buy">{formatCurrency(stats.deposits, currency)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-text-secondary mb-1">Withdrawals</p>
            <p className="text-lg font-bold text-sell">{formatCurrency(stats.withdrawals, currency)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-text-secondary mb-1">Trade Volume</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(stats.tradeVolume, currency)}</p>
          </Card>
        </div>

        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <SegmentedControl
            options={[
              { label: 'All', value: 'all' },
              { label: 'Deposits', value: 'deposit' },
              { label: 'Withdrawals', value: 'withdraw' },
              { label: 'Trades', value: 'trade' },
              { label: 'Adjustments', value: 'admin_adjustment' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as FilterType)}
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-text-secondary text-sm">No transactions found</p>
            </div>
          ) : (
            filtered.slice(0, 50).map((tx) => {
              const isPositive = tx.amount > 0
              const icon = tx.type === 'deposit' ? (
                <ArrowDownLeft size={16} className="text-buy" />
              ) : tx.type === 'withdraw' ? (
                <ArrowUpRight size={16} className="text-sell" />
              ) : tx.type === 'trade' ? (
                isPositive ? <Plus size={16} className="text-buy" /> : <Minus size={16} className="text-sell" />
              ) : (
                <ArrowLeftRight size={16} className="text-accent" />
              )

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPositive ? 'bg-buy/10' : 'bg-sell/10'}`}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                        <p className="text-xs text-text-secondary">
                          {getUserName(tx.userId)} · {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount, currency)}
                      </p>
                      <Badge variant="neutral">{tx.type.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </PageTransition>
  )
}
