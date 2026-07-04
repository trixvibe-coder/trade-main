import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Asset, Candle, MarketSettings, MarketMode, MarketStatus } from '../types'
import { DEFAULT_ASSETS, STORAGE_KEYS } from '../constants'
import { getItem, setItem } from '../utils/storage'
import {
  generateInitialCandles,
  generateNextCandle,
  updateLiveCandle,
  getTickInterval,
  CANDLE_INTERVAL,
} from '../engine/marketEngine'

interface MarketContextValue {
  assets: Asset[]
  settings: MarketSettings
  candles: Record<string, Candle[]>
  updateSettings: (updates: Partial<MarketSettings>) => void
  setMode: (mode: MarketMode) => void
  setStatus: (status: MarketStatus) => void
  toggleFavorite: (symbol: string) => void
  getAsset: (symbol: string) => Asset | undefined
  getCandles: (symbol: string) => Candle[]
  resetAssetPrice: (symbol: string, price: number) => void
}

const MarketContext = createContext<MarketContextValue | null>(null)

const CANDLE_COUNT = 120

function getDefaultSettings(): MarketSettings {
  return getItem<MarketSettings>(STORAGE_KEYS.MARKET_SETTINGS, {
    status: 'running',
    mode: 'random',
    speed: 50,
    trendStrength: 50,
    volatility: 50,
    startingPrice: 0,
  })
}

function getFavorites(): string[] {
  return getItem<string[]>(STORAGE_KEYS.FAVORITES, [])
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MarketSettings>(getDefaultSettings)
  const [favorites, setFavorites] = useState<string[]>(getFavorites)
  const [assets, setAssets] = useState<Asset[]>([])
  const [candles, setCandles] = useState<Record<string, Candle[]>>({})

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    setItem(STORAGE_KEYS.MARKET_SETTINGS, settings)
  }, [settings])

  useEffect(() => {
    setItem(STORAGE_KEYS.FAVORITES, favorites)
  }, [favorites])

  useEffect(() => {
    const savedPrices = getItem<Record<string, number>>(STORAGE_KEYS.ASSET_PRICES, {})
    const initialAssets: Asset[] = DEFAULT_ASSETS.map((a) => {
      const price = savedPrices[a.symbol] ?? a.basePrice
      return {
        ...a,
        currentPrice: price,
        dailyChange: 0,
        dailyChangePercent: 0,
        favorites: [],
      }
    })

    const initialCandles: Record<string, Candle[]> = {}
    for (const asset of initialAssets) {
      initialCandles[asset.symbol] = generateInitialCandles(asset.currentPrice, CANDLE_COUNT, settingsRef.current)
    }

    setAssets(initialAssets)
    setCandles(initialCandles)
  }, [])

  useEffect(() => {
    if (settings.status !== 'running') return

    const currentSettings = settingsRef.current

    const tick = () => {
      const s = settingsRef.current
      const now = Math.floor(Date.now() / 1000)

      setCandles((prevCandles) => {
        const updatedCandles: Record<string, Candle[]> = {}
        const updatedAssets: Asset[] = []

        for (const symbol of Object.keys(prevCandles)) {
          const candleList = prevCandles[symbol]
          if (!candleList || candleList.length === 0) {
            updatedCandles[symbol] = candleList
            continue
          }

          const lastCandle = candleList[candleList.length - 1]
          let newCandleList: Candle[]

          if (now - lastCandle.time >= CANDLE_INTERVAL / 1000) {
            const newCandle = generateNextCandle(lastCandle.close, s, now)
            newCandleList = [...candleList.slice(-CANDLE_COUNT + 1), newCandle]
          } else {
            const updated = updateLiveCandle(lastCandle, s)
            newCandleList = [...candleList.slice(0, -1), updated]
          }

          updatedCandles[symbol] = newCandleList
        }

        setAssets((prevAssets) =>
          prevAssets.map((asset) => {
            const candleList = updatedCandles[asset.symbol]
            if (!candleList || candleList.length === 0) return asset
            const lastCandle = candleList[candleList.length - 1]
            const firstCandle = candleList[0]
            const dailyChange = lastCandle.close - firstCandle.open
            const dailyChangePercent = (dailyChange / firstCandle.open) * 100
            return {
              ...asset,
              currentPrice: lastCandle.close,
              dailyChange,
              dailyChangePercent,
            }
          }),
        )

        return updatedCandles
      })
    }

    const interval = setInterval(tick, getTickInterval(currentSettings.speed))
    return () => clearInterval(interval)
  }, [settings.status, settings.speed, settings.mode, settings.volatility, settings.trendStrength])

  useEffect(() => {
    if (assets.length === 0) return
    const prices: Record<string, number> = {}
    for (const a of assets) prices[a.symbol] = a.currentPrice
    setItem(STORAGE_KEYS.ASSET_PRICES, prices)
  }, [assets])

  const updateSettings: MarketContextValue['updateSettings'] = (updates) => {
    setSettings((s) => ({ ...s, ...updates }))
  }

  const setMode = (mode: MarketMode) => setSettings((s) => ({ ...s, mode }))
  const setStatus = (status: MarketStatus) => setSettings((s) => ({ ...s, status }))

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(symbol)
      return exists ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    })
  }

  const getAsset = (symbol: string) => assets.find((a) => a.symbol === symbol)
  const getCandles = (symbol: string) => candles[symbol] || []

  const resetAssetPrice = (symbol: string, price: number) => {
    setCandles((prev) => ({
      ...prev,
      [symbol]: generateInitialCandles(price, CANDLE_COUNT, settingsRef.current),
    }))
    setAssets((prev) => prev.map((a) => (a.symbol === symbol ? { ...a, currentPrice: price } : a)))
  }

  return (
    <MarketContext.Provider
      value={{
        assets: assets.map((a) => ({ ...a, favorites })),
        settings,
        candles,
        updateSettings,
        setMode,
        setStatus,
        toggleFavorite,
        getAsset,
        getCandles,
        resetAssetPrice,
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket must be used within MarketProvider')
  return ctx
}
