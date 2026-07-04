import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'buy' | 'sell' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-110',
  buy: 'bg-buy text-white hover:brightness-110',
  sell: 'bg-sell text-white hover:brightness-110',
  ghost: 'bg-transparent text-text-secondary hover:bg-card hover:text-text-primary',
  outline: 'bg-transparent border border-border text-text-primary hover:bg-card',
  danger: 'bg-sell/10 text-sell border border-sell/20 hover:bg-sell/20',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-6 py-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, className = '', children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...(props as any)}
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
