import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface SegmentedControlProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ options, value, onChange, className = '' }: SegmentedControlProps) {
  return (
    <div className={`inline-flex bg-surface rounded-xl p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="relative px-4 py-2 text-sm font-medium transition-colors rounded-lg"
        >
          {value === option.value && (
            <motion.div
              layoutId="segmented-bg"
              className="absolute inset-0 bg-card rounded-lg shadow-soft"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          <span className={`relative z-10 ${value === option.value ? 'text-text-primary' : 'text-text-secondary'}`}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  icon?: ReactNode
}

export function Toggle({ checked, onChange, label, description, icon }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon && <div className="text-text-secondary">{icon}</div>}
        <div>
          {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
          {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-accent' : 'bg-surface border border-border'}`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-soft"
        />
      </button>
    </div>
  )
}
