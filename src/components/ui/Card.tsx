import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
      className={`card p-5 ${hover ? 'cursor-pointer transition-shadow hover:shadow-card' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
