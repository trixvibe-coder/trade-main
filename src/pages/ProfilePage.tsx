import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Mail, Wallet, Calendar, Edit2, Key, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useTrade } from '../context/TradeContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { showToast } from '../components/ui/Toast'
import { PageTransition } from '../components/ui/PageTransition'
import { formatCurrency, formatDate } from '../utils/format'

export function ProfilePage() {
  const { user, logout, updateProfile, changePassword } = useAuth()
  const { currency } = useSettings()
  const { getUserTrades } = useTrade()
  const navigate = useNavigate()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  if (!user) return null

  const userTrades = getUserTrades(user.id)
  const closedTrades = userTrades.filter((t) => t.status !== 'open')
  const wins = closedTrades.filter((t) => t.status === 'win')
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSaveProfile = () => {
    updateProfile({ username, email })
    setShowEditModal(false)
    showToast('Profile updated', 'success')
  }

  const handleChangePassword = () => {
    setPasswordError('')
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    const result = changePassword(currentPassword, newPassword)
    if (result.success) {
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      showToast('Password changed', 'success')
    } else {
      setPasswordError(result.error || 'Failed to change password')
    }
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 text-center"
        >
          <img src={user.avatar} alt="avatar" className="w-20 h-20 rounded-full mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary">{user.username}</h1>
          <p className="text-sm text-text-secondary mt-1">{user.email}</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge variant={user.role === 'admin' ? 'info' : 'neutral'}>
              {user.role === 'admin' ? 'Administrator' : 'Trader'}
            </Badge>
            <Badge variant="neutral">Member since {formatDate(user.createdAt)}</Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-accent" />
              <p className="text-xs text-text-secondary">Balance</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(user.balance, currency)}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-buy" />
              <p className="text-xs text-text-secondary">Win Rate</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{winRate.toFixed(1)}%</p>
          </Card>
        </div>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Account Information</h2>
          <div className="space-y-3">
            <InfoRow icon={<Edit2 size={16} />} label="Username" value={user.username} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={user.email} />
            <InfoRow icon={<Wallet size={16} />} label="Balance" value={formatCurrency(user.balance, currency)} />
            <InfoRow icon={<Calendar size={16} />} label="Joined" value={formatDate(user.createdAt)} />
          </div>
        </Card>

        <div className="space-y-2">
          <Button variant="outline" fullWidth size="lg" onClick={() => setShowEditModal(true)}>
            <Edit2 size={18} />
            Edit Profile
          </Button>
          <Button variant="outline" fullWidth size="lg" onClick={() => setShowPasswordModal(true)}>
            <Key size={18} />
            Change Password
          </Button>
          <Button variant="danger" fullWidth size="lg" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
        <div className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<Edit2 size={18} />}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
          />
          <Button fullWidth size="lg" onClick={handleSaveProfile}>
            Save Changes
          </Button>
        </div>
      </Modal>

      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            icon={<Key size={18} />}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Key size={18} />}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            icon={<Key size={18} />}
          />
          {passwordError && (
            <p className="text-sm text-sell bg-sell/10 border border-sell/20 rounded-xl px-4 py-2.5">
              {passwordError}
            </p>
          )}
          <Button fullWidth size="lg" onClick={handleChangePassword}>
            Change Password
          </Button>
        </div>
      </Modal>
    </PageTransition>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}
