import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  trend?: { value: string; positive: boolean }
  accent?: 'buy' | 'sell' | 'accent' | 'default'
}

const accentClasses = {
  buy: 'text-buy bg-buy/10',
  sell: 'text-sell bg-sell/10',
  accent: 'text-accent bg-accent/10',
  default: 'text-text-secondary bg-surface',
}

export function StatCard({ label, value, icon, trend, accent = 'default' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-semibold ${trend.positive ? 'text-buy' : 'text-sell'}`}>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-text-secondary text-sm mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-text-primary">{value}</p>
    </motion.div>
  )
}
