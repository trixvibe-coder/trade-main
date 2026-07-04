import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Eye, EyeOff, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { showToast } from '../../components/ui/Toast'
import { ADMIN_CREDENTIALS } from '../../constants'

export function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = login(email, password)
    setLoading(false)

    if (result.success && email === ADMIN_CREDENTIALS.email) {
      showToast('Admin login successful', 'success')
      navigate('/admin/dashboard')
    } else {
      setError('Invalid admin credentials')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4 relative">
            <TrendingUp size={28} className="text-white" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border-2 border-background flex items-center justify-center">
              <Shield size={12} className="text-accent" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
          <p className="text-text-secondary text-sm mt-2">Sign in to manage TradeFlow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Email"
            type="email"
            placeholder="admin@tradeflow.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[42px] text-text-secondary hover:text-text-primary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-sell bg-sell/10 border border-sell/20 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Sign In as Admin
          </Button>
        </form>

        <div className="mt-6 p-4 bg-surface border border-border rounded-xl">
          <p className="text-xs text-text-secondary text-center">
            <span className="text-text-primary font-semibold">Admin:</span> admin@tradeflow.io / admin123
          </p>
        </div>
      </motion.div>
    </div>
  )
}
