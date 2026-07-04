import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useAnimation } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { formatCurrency } from '../../utils/format'

export function TopBar({ title }: { title?: string }) {
  const { user } = useAuth()
  const { currency } = useSettings()
  const navigate = useNavigate()
  const controls = useAnimation()
  const prevBalanceRef = useRef(user?.balance || 0)

  useEffect(() => {
    const currentBalance = user?.balance || 0
    const prevBalance = prevBalanceRef.current
    if (currentBalance !== prevBalance) {
      const increased = currentBalance > prevBalance
      controls.start({
        scale: [1, 1.08, 1],
        color: increased ? ['#FFFFFF', '#16C784', '#FFFFFF'] : ['#FFFFFF', '#EA3943', '#FFFFFF'],
        transition: { duration: 0.6, ease: 'easeOut' },
      })
      prevBalanceRef.current = currentBalance
    }
  }, [user?.balance, controls])

  return (
    <header className="lg:hidden sticky top-0 z-20 bg-surface/95 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-text-primary">{title || 'TradeFlow'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-text-secondary">Balance</p>
            <motion.p
              animate={controls}
              className="text-sm font-bold text-text-primary"
            >
              {formatCurrency(user?.balance || 0, currency)}
            </motion.p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="relative"
          >
            <img src={user?.avatar} alt="avatar" className="w-9 h-9 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  )
}
