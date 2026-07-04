import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, CurrencyCode, Language, Transaction } from '../types'
import { STORAGE_KEYS, ADMIN_CREDENTIALS } from '../constants'
import { getItem, setItem, removeItem, generateId, generateAvatar } from '../utils/storage'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (username: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string }
  updateBalance: (userId: string, newBalance: number) => void
  adjustBalance: (amount: number, description: string) => void
  getAllUsers: () => User[]
  updateUser: (userId: string, updates: Partial<User>) => void
  deleteUser: (userId: string) => void
  toggleBlockUser: (userId: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function seedUsers(): User[] {
  const existing = getItem<User[]>(STORAGE_KEYS.USERS, [])
  if (existing.length > 0) return existing

  const admin: User = {
    id: 'admin-001',
    username: 'Admin',
    email: ADMIN_CREDENTIALS.email,
    password: ADMIN_CREDENTIALS.password,
    balance: 1000000,
    role: 'admin',
    avatar: generateAvatar('Admin'),
    isBlocked: false,
    createdAt: Date.now() - 86400000 * 30,
    currency: 'USD',
    language: 'en',
    notifications: true,
    darkTheme: true,
  }

  const demoUser: User = {
    id: 'user-001',
    username: 'Demo Trader',
    email: 'demo@tradeflow.io',
    password: 'demo123',
    balance: 10000,
    role: 'user',
    avatar: generateAvatar('Demo Trader'),
    isBlocked: false,
    createdAt: Date.now() - 86400000 * 7,
    currency: 'USD',
    language: 'en',
    notifications: true,
    darkTheme: true,
  }

  const users = [admin, demoUser]
  setItem(STORAGE_KEYS.USERS, users)
  return users
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null)
  })

  useEffect(() => {
    seedUsers()
  }, [])

  useEffect(() => {
    if (user) {
      setItem(STORAGE_KEYS.CURRENT_USER, user)
      const users = getItem<User[]>(STORAGE_KEYS.USERS, [])
      const updated = users.map((u) => (u.id === user.id ? user : u))
      setItem(STORAGE_KEYS.USERS, updated)
    }
  }, [user])

  const login: AuthContextValue['login'] = (email, password) => {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, [])

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const admin = users.find((u) => u.role === 'admin')
      if (admin) {
        setUser(admin)
        return { success: true }
      }
    }

    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!found) return { success: false, error: 'No account found with this email' }
    if (found.password !== password) return { success: false, error: 'Incorrect password' }
    if (found.isBlocked) return { success: false, error: 'Your account has been blocked' }

    setUser(found)
    return { success: true }
  }

  const register: AuthContextValue['register'] = (username, email, password) => {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, [])
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists' }
    }

    const newUser: User = {
      id: generateId(),
      username,
      email,
      password,
      balance: 10000,
      role: 'user',
      avatar: generateAvatar(username),
      isBlocked: false,
      createdAt: Date.now(),
      currency: 'USD',
      language: 'en',
      notifications: true,
      darkTheme: true,
    }

    const updated = [...users, newUser]
    setItem(STORAGE_KEYS.USERS, updated)
    setUser(newUser)
    return { success: true }
  }

  const logout = () => {
    removeItem(STORAGE_KEYS.CURRENT_USER)
    setUser(null)
  }

  const updateProfile: AuthContextValue['updateProfile'] = (updates) => {
    if (!user) return
    const updated = { ...user, ...updates }
    if (updates.username) updated.avatar = generateAvatar(updates.username)
    setUser(updated)
  }

  const changePassword: AuthContextValue['changePassword'] = (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not logged in' }
    if (user.password !== currentPassword) return { success: false, error: 'Current password is incorrect' }
    updateProfile({ password: newPassword })
    return { success: true }
  }

  const updateBalance: AuthContextValue['updateBalance'] = (userId, newBalance) => {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, [])
    const updated = users.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u))
    setItem(STORAGE_KEYS.USERS, updated)
    if (user?.id === userId) setUser((prev) => (prev ? { ...prev, balance: newBalance } : prev))
  }

  const adjustBalance: AuthContextValue['adjustBalance'] = (amount, description) => {
    if (!user) return
    const newBalance = Math.max(0, user.balance + amount)
    updateProfile({ balance: newBalance })

    const transactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
    transactions.unshift({
      id: generateId(),
      userId: user.id,
      type: 'admin_adjustment',
      amount,
      description,
      createdAt: Date.now(),
    })
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions)
  }

  const getAllUsers = () => getItem<User[]>(STORAGE_KEYS.USERS, [])

  const updateUser: AuthContextValue['updateUser'] = (userId, updates) => {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, [])
    const updated = users.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    setItem(STORAGE_KEYS.USERS, updated)
    if (user?.id === userId) setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  const deleteUser: AuthContextValue['deleteUser'] = (userId) => {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, [])
    const updated = users.filter((u) => u.id !== userId)
    setItem(STORAGE_KEYS.USERS, updated)
  }

  const toggleBlockUser: AuthContextValue['toggleBlockUser'] = (userId) => {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, [])
    const updated = users.map((u) => (u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u))
    setItem(STORAGE_KEYS.USERS, updated)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        updateBalance,
        adjustBalance,
        getAllUsers,
        updateUser,
        deleteUser,
        toggleBlockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
