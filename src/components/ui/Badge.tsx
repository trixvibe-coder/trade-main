import { type ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'error' | 'info' | 'neutral' | 'warning'
  size?: 'sm' | 'md'
}

const variantClasses = {
  success: 'bg-buy/10 text-buy border-buy/20',
  error: 'bg-sell/10 text-sell border-sell/20',
  info: 'bg-accent/10 text-accent border-accent/20',
  neutral: 'bg-surface text-text-secondary border-border',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
}

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border font-medium ${variantClasses[variant]} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      {children}
    </span>
  )
}
