import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>}
        <div className="relative">
          {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</span>}
          <input
            ref={ref}
            className={`input-field w-full ${icon ? 'pl-11' : ''} ${error ? 'border-sell/50' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-sell">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
