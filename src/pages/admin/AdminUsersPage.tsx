import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Ban, Trash2, Edit2, Users, Shield, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { PageTransition } from '../../components/ui/PageTransition'
import { formatCurrency, formatDate } from '../../utils/format'
import type { User } from '../../types'

export function AdminUsersPage() {
  const { getAllUsers, updateUser, deleteUser, toggleBlockUser } = useAuth()
  const { currency } = useSettings()
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [editBalance, setEditBalance] = useState('')
  const [editUsername, setEditUsername] = useState('')

  const users = useMemo(() => {
    const all = getAllUsers().filter((u) => u.role === 'user')
    if (!search) return all
    const lower = search.toLowerCase()
    return all.filter((u) => u.username.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower))
  }, [getAllUsers, search])

  const handleEditOpen = (user: User) => {
    setEditUser(user)
    setEditBalance(user.balance.toString())
    setEditUsername(user.username)
  }

  const handleEditSave = () => {
    if (!editUser) return
    const newBalance = parseFloat(editBalance)
    if (isNaN(newBalance) || newBalance < 0) {
      showToast('Invalid balance', 'error')
      return
    }
    updateUser(editUser.id, { balance: newBalance, username: editUsername })
    showToast('User updated', 'success')
    setEditUser(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteUser(deleteTarget.id)
    showToast('User deleted', 'success')
    setDeleteTarget(null)
  }

  const handleToggleBlock = (user: User) => {
    toggleBlockUser(user.id)
    showToast(user.isBlocked ? 'User unblocked' : 'User blocked', 'info')
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary text-sm mt-1">Manage platform users</p>
        </div>

        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-accent" />
              <p className="text-xs text-text-secondary">Total Users</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{users.length}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-buy" />
              <p className="text-xs text-text-secondary">Active</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{users.filter((u) => !u.isBlocked).length}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Ban size={14} className="text-sell" />
              <p className="text-xs text-text-secondary">Blocked</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{users.filter((u) => u.isBlocked).length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-text-secondary mb-1">Total Balance</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(users.reduce((s, u) => s + u.balance, 0), currency)}</p>
          </Card>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {users.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-text-primary">{user.username}</p>
                        {user.isBlocked && <Badge variant="error">Blocked</Badge>}
                      </div>
                      <p className="text-xs text-text-secondary">{user.email}</p>
                      <p className="text-xs text-text-secondary mt-0.5">Joined {formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-xs text-text-secondary">Balance</p>
                      <p className="text-sm font-bold text-text-primary">{formatCurrency(user.balance, currency)}</p>
                    </div>
                    <button
                      onClick={() => handleEditOpen(user)}
                      className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleBlock(user)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                        user.isBlocked
                          ? 'bg-buy/10 border-buy/20 text-buy'
                          : 'bg-surface border-border text-text-secondary hover:text-yellow-500 hover:border-yellow-500/30'
                      }`}
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-sell hover:border-sell/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {users.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-text-secondary text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <img src={editUser.avatar} alt="avatar" className="w-12 h-12 rounded-full" />
              <div>
                <p className="text-sm font-bold text-text-primary">{editUser.username}</p>
                <p className="text-xs text-text-secondary">{editUser.email}</p>
              </div>
            </div>
            <Input
              label="Username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              icon={<Edit2 size={18} />}
            />
            <Input
              label="Balance"
              type="number"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              icon={<span className="text-sm font-medium">{currency}</span>}
            />
            <Button fullWidth size="lg" onClick={handleEditSave}>
              Save Changes
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-sell/10 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={28} className="text-sell" />
              </div>
              <p className="text-sm text-text-primary">
                Are you sure you want to delete <span className="font-bold">{deleteTarget.username}</span>?
              </p>
              <p className="text-xs text-text-secondary mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="sell" fullWidth onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  )
}
