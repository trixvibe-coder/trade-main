import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CurrencyCode, Language } from '../types'
import { STORAGE_KEYS } from '../constants'
import { getItem, setItem } from '../utils/storage'

interface SettingsContextValue {
  currency: CurrencyCode
  language: Language
  notifications: boolean
  darkTheme: boolean
  setCurrency: (currency: CurrencyCode) => void
  setLanguage: (language: Language) => void
  setNotifications: (enabled: boolean) => void
  setDarkTheme: (enabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

interface SettingsState {
  currency: CurrencyCode
  language: Language
  notifications: boolean
  darkTheme: boolean
}

function loadSettings(): SettingsState {
  return getItem<SettingsState>(STORAGE_KEYS.SETTINGS, {
    currency: 'USD',
    language: 'en',
    notifications: true,
    darkTheme: true,
  })
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(loadSettings)

  useEffect(() => {
    setItem(STORAGE_KEYS.SETTINGS, state)
  }, [state])

  const setCurrency = (currency: CurrencyCode) => setState((s) => ({ ...s, currency }))
  const setLanguage = (language: Language) => setState((s) => ({ ...s, language }))
  const setNotifications = (notifications: boolean) => setState((s) => ({ ...s, notifications }))
  const setDarkTheme = (darkTheme: boolean) => setState((s) => ({ ...s, darkTheme }))

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        setCurrency,
        setLanguage,
        setNotifications,
        setDarkTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
