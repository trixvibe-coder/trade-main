import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastCallback: ((toast: Omit<Toast, 'id'>) => void) | null = null

export function showToast(message: string, type: ToastType = 'info') {
  if (toastCallback) toastCallback({ message, type })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const activeKeysRef = useRef<Set<string>>(new Set())

  const remove = useCallback((id: string, key: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    activeKeysRef.current.delete(key)
  }, [])

  useEffect(() => {
    toastCallback = (toast) => {
      const key = `${toast.type}:${toast.message}`
      if (activeKeysRef.current.has(key)) return
      activeKeysRef.current.add(key)

      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { ...toast, id }])
      setTimeout(() => remove(id, key), 3000)
    }
    return () => {
      toastCallback = null
    }
  }, [remove])

  const icons = {
    success: <CheckCircle2 size={20} className="text-buy" />,
    error: <XCircle size={20} className="text-sell" />,
    info: <Info size={20} className="text-accent" />,
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-card max-w-xs pointer-events-auto"
          >
            {icons[toast.type]}
            <span className="text-sm text-text-primary font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
