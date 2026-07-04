import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Globe,
  Bell,
  Moon,
  User,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { Card } from '../components/ui/Card'
import { Toggle } from '../components/ui/Controls'
import { Modal } from '../components/ui/Modal'
import { useState } from 'react'
import { PageTransition } from '../components/ui/PageTransition'
import { CURRENCIES, LANGUAGES } from '../constants'
import { showToast } from '../components/ui/Toast'
import type { CurrencyCode, Language } from '../types'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const { currency, language, notifications, darkTheme, setCurrency, setLanguage, setNotifications, setDarkTheme } = useSettings()
  const navigate = useNavigate()

  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Customize your trading experience</p>
        </div>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Preferences</h2>
          <div className="divide-y divide-border">
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="flex items-center justify-between w-full py-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-accent">
                  <DollarSign size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">Display Currency</p>
                  <p className="text-xs text-text-secondary">Change how prices are displayed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">{currency}</span>
                <ChevronRight size={16} className="text-text-secondary group-hover:text-text-primary transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center justify-between w-full py-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-accent">
                  <Globe size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">Language</p>
                  <p className="text-xs text-text-secondary">App display language</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">
                  {LANGUAGES.find((l) => l.code === language)?.name}
                </span>
                <ChevronRight size={16} className="text-text-secondary group-hover:text-text-primary transition-colors" />
              </div>
            </button>

            <Toggle
              icon={<Bell size={18} />}
              label="Notifications"
              description="Trade alerts and updates"
              checked={notifications}
              onChange={(v) => {
                setNotifications(v)
                showToast(v ? 'Notifications enabled' : 'Notifications disabled', 'info')
              }}
            />

            <Toggle
              icon={<Moon size={18} />}
              label="Dark Theme"
              description="Use dark color scheme"
              checked={darkTheme}
              onChange={setDarkTheme}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Account</h2>
          <div className="divide-y divide-border">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-between w-full py-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-accent">
                  <User size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">Profile Settings</p>
                  <p className="text-xs text-text-secondary">Edit your account details</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-secondary group-hover:text-text-primary transition-colors" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full py-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sell/10 flex items-center justify-center text-sell">
                  <LogOut size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-sell">Logout</p>
                  <p className="text-xs text-text-secondary">Sign out of your account</p>
                </div>
              </div>
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-text-secondary py-4">
          TradeFlow v1.0.0 — Trading Simulator
        </p>
      </div>

      <Modal open={showCurrencyModal} onClose={() => setShowCurrencyModal(false)} title="Select Currency">
        <div className="space-y-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code as CurrencyCode)
                setShowCurrencyModal(false)
                showToast(`Currency changed to ${c.name}`, 'success')
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                currency === c.code ? 'bg-accent/10 border border-accent/30' : 'bg-surface border border-border hover:border-border/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-text-primary w-8 text-center">{c.symbol}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">{c.code}</p>
                  <p className="text-xs text-text-secondary">{c.name}</p>
                </div>
              </div>
              {currency === c.code && <Check size={18} className="text-accent" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={showLanguageModal} onClose={() => setShowLanguageModal(false)} title="Select Language">
        <div className="space-y-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code as Language)
                setShowLanguageModal(false)
                showToast(`Language changed to ${l.name}`, 'success')
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                language === l.code ? 'bg-accent/10 border border-accent/30' : 'bg-surface border border-border hover:border-border/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-secondary w-8 text-center bg-card rounded-md py-1">{l.flag}</span>
                <p className="text-sm font-semibold text-text-primary">{l.name}</p>
              </div>
              {language === l.code && <Check size={18} className="text-accent" />}
            </button>
          ))}
        </div>
      </Modal>
    </PageTransition>
  )
}
