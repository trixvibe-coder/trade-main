import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTrade } from '../context/TradeContext'
import { useSettings } from '../context/SettingsContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { SegmentedControl } from '../components/ui/Controls'
import { Badge } from '../components/ui/Badge'
import { showToast } from '../components/ui/Toast'
import { PageTransition } from '../components/ui/PageTransition'
import { formatCurrency, formatDateTime } from '../utils/format'
import { useCountUp } from '../hooks/useCountUp'

export function WalletPage() {
  const { user, adjustBalance } = useAuth()
  const { getUserTransactions } = useTrade()
  const { currency } = useSettings()
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')

  const transactions = useMemo(() => {
    if (!user) return []
    return getUserTransactions(user.id).slice(0, 20)
  }, [user, getUserTransactions])

  const animatedBalance = useCountUp(user?.balance || 0)

  const handleAction = () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }

    if (modalType === 'deposit') {
      adjustBalance(num, 'Deposit')
      showToast(`Deposited ${formatCurrency(num, currency)}`, 'success')
    } else {
      if (num > (user?.balance || 0)) {
        showToast('Insufficient balance', 'error')
        return
      }
      adjustBalance(-num, 'Withdrawal')
      showToast(`Withdrew ${formatCurrency(num, currency)}`, 'success')
    }
    setAmount('')
    setShowModal(false)
  }

  const openModal = (type: 'deposit' | 'withdraw') => {
    setModalType(type)
    setShowModal(true)
  }

  if (!user) return null

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Wallet</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your funds</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-br from-card to-surface"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-accent" />
            <p className="text-sm text-text-secondary">Total Balance</p>
          </div>
          <p className="text-3xl font-bold text-text-primary mb-4">
            {formatCurrency(animatedBalance, currency)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="buy" fullWidth onClick={() => openModal('deposit')}>
              <ArrowDownLeft size={18} />
              Deposit
            </Button>
            <Button variant="outline" fullWidth onClick={() => openModal('withdraw')}>
              <ArrowUpRight size={18} />
              Withdraw
            </Button>
          </div>
        </motion.div>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-secondary text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isPositive ? 'bg-buy/10' : 'bg-sell/10'
                      }`}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                        <p className="text-xs text-text-secondary">{formatDateTime(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount, currency)}
                      </p>
                      <Badge variant="neutral">{tx.type}</Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={modalType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}>
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
              modalType === 'deposit' ? 'bg-buy/10' : 'bg-sell/10'
            }`}>
              {modalType === 'deposit' ? <ArrowDownLeft size={28} className="text-buy" /> : <ArrowUpRight size={28} className="text-sell" />}
            </div>
            <p className="text-sm text-text-secondary">
              Available: <span className="text-text-primary font-semibold">{formatCurrency(user.balance, currency)}</span>
            </p>
          </div>

          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            icon={<span className="text-sm font-medium">{currency}</span>}
          />

          <div className="flex gap-2">
            {[50, 100, 500, 1000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="flex-1 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <Button
            variant={modalType === 'deposit' ? 'buy' : 'outline'}
            fullWidth
            size="lg"
            onClick={handleAction}
          >
            {modalType === 'deposit' ? 'Deposit' : 'Withdraw'}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  )
}
